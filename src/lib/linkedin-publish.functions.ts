import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { logAudit } from "./audit";
import { getLinkedInCapabilityFromCoreos } from "./linkedin-capability";
import {
  getLinkedInCurrentMemberIdentity,
  getLinkedInRuntimeReadiness,
  publishLinkedInImagePost,
  publishLinkedInTextPost,
  uploadLinkedInImage,
} from "./linkedin.server";

const MEDIA_BUCKET = "studio-media";
const READY_MEDIA_APPROVAL = new Set(["APPROVED", "EXPORTED"]);
const LINKEDIN_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/gif"]);

function safeErrorMessage(error: unknown): string {
  const value = error instanceof Error ? error.message : "Okänt LinkedIn-fel";
  return value.slice(0, 900);
}

export const prepareLinkedInManualHandoff = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator((d: { post_id: string; language?: "sv" | "en" }) => d)
  .handler(async ({ data, context }) => {
    const { data: post, error } = await context.db
      .from("social_posts")
      .select("id,status,network,copy_sv,copy_en")
      .eq("id", data.post_id)
      .single();
    if (error) throw new Error(error.message);
    if (post.network !== "LinkedIn") throw new Error("LINKEDIN_POST_REQUIRED");
    if (post.status !== "APPROVED" && !post.status.startsWith("SCHEDULED")) {
      throw new Error("LINKEDIN_POST_MUST_BE_APPROVED");
    }

    const copy =
      (data.language === "en" ? post.copy_en : post.copy_sv) || post.copy_sv || post.copy_en || "";
    if (!copy.trim()) throw new Error("LINKEDIN_COPY_REQUIRED");

    await context.db.from("publish_attempts").insert({
      post_id: data.post_id,
      schedule_id: null,
      provider: "linkedin-manual-handoff",
      status: "MANUAL HANDOFF — READY",
      error_message: null,
      attempted_by: context.userId,
    });
    await logAudit(
      context.db,
      context,
      "social.publish.attempt",
      { type: "social_post", id: data.post_id },
      {
        provider: "linkedin",
        mode: "manual_handoff",
        destination: "linkedin_official_composer",
      },
    );

    return {
      copy,
      composerUrl: "https://www.linkedin.com/feed/?shareActive=true",
      message:
        "Texten är klar för manuell publicering. Film Studio loggar handoffen men markerar inte inlägget som PUBLISHED utan verifierat LinkedIn-svar.",
    };
  });

export const publishConfirmedLinkedInPost = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator(
    (d: {
      post_id: string;
      schedule_id?: string | null;
      confirmed: boolean;
      language?: "sv" | "en";
    }) => d,
  )
  .handler(async ({ data, context }) => {
    if (data.confirmed !== true) {
      throw new Error("EXPLICIT_PUBLISH_CONFIRMATION_REQUIRED");
    }

    const { data: post, error: postError } = await context.db
      .from("social_posts")
      .select("id,status,network,copy_sv,copy_en")
      .eq("id", data.post_id)
      .single();
    if (postError) throw new Error(postError.message);

    if (post.network !== "LinkedIn") throw new Error("LINKEDIN_POST_REQUIRED");
    if (post.status !== "APPROVED" && !post.status.startsWith("SCHEDULED")) {
      throw new Error("LINKEDIN_POST_MUST_BE_APPROVED");
    }

    const runtime = getLinkedInRuntimeReadiness();
    if (!runtime.configured) {
      await context.db.from("publish_attempts").insert({
        post_id: data.post_id,
        schedule_id: data.schedule_id ?? null,
        provider: "linkedin",
        status: "BLOCKED — CONNECTION REQUIRED",
        error_message: runtime.note.slice(0, 900),
        attempted_by: context.userId,
      });
      return {
        published: false,
        message: "LinkedIn-token saknas i produktion. Inget publicerades.",
      };
    }

    const capability = await getLinkedInCapabilityFromCoreos(context.coreos);
    const commentary =
      (data.language === "en" ? post.copy_en : post.copy_sv) || post.copy_sv || post.copy_en || "";
    if (!commentary.trim()) throw new Error("LINKEDIN_COPY_REQUIRED");

    try {
      let authorUrn: string;
      let principalSource: "coreos" | "linkedin-current-member";

      if (capability.publishCapable && capability.resourceId) {
        authorUrn = capability.resourceId;
        principalSource = "coreos";
      } else {
        const member = await getLinkedInCurrentMemberIdentity();
        authorUrn = member.urn;
        principalSource = "linkedin-current-member";
      }

      const links = await context.db
        .from("social_post_assets")
        .select("media_asset_id,alt_text")
        .eq("post_id", data.post_id)
        .order("sort_order", { ascending: true });
      if (links.error) throw new Error(links.error.message);

      let result: Awaited<ReturnType<typeof publishLinkedInTextPost>>;
      if ((links.data ?? []).length > 0) {
        const assetIds = (links.data ?? []).map((row) => row.media_asset_id);
        const assets = await context.db
          .from("media_assets")
          .select("id,kind,storage_path,mime_type,approval_status,name")
          .in("id", assetIds);
        if (assets.error) throw new Error(assets.error.message);

        const ready = (assets.data ?? []).filter(
          (asset) =>
            asset.kind === "image" &&
            Boolean(asset.storage_path) &&
            Boolean(asset.mime_type) &&
            LINKEDIN_IMAGE_MIME.has(asset.mime_type!.toLowerCase()) &&
            READY_MEDIA_APPROVAL.has(asset.approval_status),
        );

        if (ready.length !== 1) {
          const reason =
            ready.length === 0
              ? "Inlägget saknar en godkänd JPG/PNG/GIF med riktig storage_path."
              : "Inlägget har flera godkända bilder. Exakt en bild krävs för detta publiceringsflöde.";
          await context.db.from("publish_attempts").insert({
            post_id: data.post_id,
            schedule_id: data.schedule_id ?? null,
            provider: "linkedin",
            status: "BLOCKED — ASSET REQUIRED",
            error_message: reason,
            attempted_by: context.userId,
          });
          return { published: false, message: reason };
        }

        const asset = ready[0];
        if (!asset) throw new Error("LINKEDIN_ASSET_REQUIRED");
        const link = (links.data ?? []).find((row) => row.media_asset_id === asset.id);
        const downloaded = await context.db.storage
          .from(MEDIA_BUCKET)
          .download(asset.storage_path!);
        if (downloaded.error || !downloaded.data) {
          throw new Error(
            `LINKEDIN_ASSET_DOWNLOAD_FAILED:${downloaded.error?.message ?? "missing file"}`,
          );
        }
        const uploaded = await uploadLinkedInImage({
          ownerUrn: authorUrn,
          bytes: await downloaded.data.arrayBuffer(),
          mimeType: asset.mime_type!,
        });
        result = await publishLinkedInImagePost({
          authorUrn,
          commentary,
          imageUrn: uploaded.imageUrn,
          altText: link?.alt_text?.trim() || asset.name,
        });
      } else {
        result = await publishLinkedInTextPost({ authorUrn, commentary });
      }

      const { error: attemptError } = await context.db.from("publish_attempts").insert({
        post_id: data.post_id,
        schedule_id: data.schedule_id ?? null,
        provider: "linkedin",
        status: "PUBLISHED",
        error_message: null,
        attempted_by: context.userId,
      });
      if (attemptError) throw new Error(attemptError.message);

      const { error: updateError } = await context.db
        .from("social_posts")
        .update({ status: "PUBLISHED" })
        .eq("id", data.post_id);
      if (updateError) throw new Error(updateError.message);

      if (data.schedule_id) {
        const { error: scheduleError } = await context.db
          .from("social_schedules")
          .update({
            status: "PUBLISHED",
            notes: `LinkedIn provider confirmed ${result.postUrn} with HTTP ${result.status}.`,
          })
          .eq("id", data.schedule_id)
          .eq("post_id", data.post_id);
        if (scheduleError) throw new Error(scheduleError.message);
      }

      await logAudit(
        context.db,
        context,
        "social.publish.success",
        { type: "social_post", id: data.post_id },
        {
          provider: "linkedin",
          provider_post_urn: result.postUrn,
          provider_status: result.status,
          linkedin_principal: authorUrn,
          principal_source: principalSource,
          capability_state: capability.state,
          granted_scopes: capability.grantedScopes,
        },
      );

      return {
        published: true,
        postUrn: result.postUrn,
        message: "LinkedIn bekräftade publiceringen med ett verkligt post-URN.",
      };
    } catch (error) {
      const message = safeErrorMessage(error);
      await context.db.from("publish_attempts").insert({
        post_id: data.post_id,
        schedule_id: data.schedule_id ?? null,
        provider: "linkedin",
        status: "FAILED",
        error_message: message,
        attempted_by: context.userId,
      });
      await logAudit(
        context.db,
        context,
        "social.publish.failed",
        { type: "social_post", id: data.post_id },
        {
          provider: "linkedin",
          error: message,
          capability_state: capability.state,
        },
      );
      return {
        published: false,
        message: `LinkedIn-publiceringen misslyckades: ${message}`,
      };
    }
  });
