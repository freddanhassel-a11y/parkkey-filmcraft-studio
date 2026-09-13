import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { logAudit } from "./audit";
import { getLinkedInCapabilityFromCoreos } from "./linkedin-capability";
import { getLinkedInRuntimeReadiness, publishLinkedInTextPost } from "./linkedin.server";

function safeErrorMessage(error: unknown): string {
  const value = error instanceof Error ? error.message : "Okänt LinkedIn-fel";
  return value.slice(0, 900);
}

/**
 * Explicit external-send gate for LinkedIn.
 *
 * The caller must pass confirmed=true from a deliberate UI confirmation. This
 * function never downgrades an attached-media post to text-only: media remains
 * blocked until a verified LinkedIn media-upload adapter exists.
 */
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

    const { count: attachedCount, error: assetError } = await context.db
      .from("social_post_assets")
      .select("media_asset_id", { count: "exact", head: true })
      .eq("post_id", data.post_id);
    if (assetError) throw new Error(assetError.message);
    if ((attachedCount ?? 0) > 0) {
      await context.db.from("publish_attempts").insert({
        post_id: data.post_id,
        schedule_id: data.schedule_id ?? null,
        provider: "linkedin",
        status: "BLOCKED — MEDIA ADAPTER REQUIRED",
        error_message:
          "Inlägget har bifogat media. Film Studio publicerar inte text-only i stället; LinkedIn-mediauppladdning måste vara verifierad först.",
        attempted_by: context.userId,
      });
      return {
        published: false,
        message:
          "Publiceringen blockerades eftersom inlägget har media och LinkedIn-mediaadaptern ännu inte är verifierad.",
      };
    }

    const capability = await getLinkedInCapabilityFromCoreos(context.coreos);
    const runtime = getLinkedInRuntimeReadiness();
    if (!capability.publishCapable || !capability.resourceId || !runtime.configured) {
      await context.db.from("publish_attempts").insert({
        post_id: data.post_id,
        schedule_id: data.schedule_id ?? null,
        provider: "linkedin",
        status: "BLOCKED — CONNECTION REQUIRED",
        error_message: `${capability.note} ${runtime.note}`.slice(0, 900),
        attempted_by: context.userId,
      });
      return {
        published: false,
        message: "LinkedIn är inte komplett verifierat för extern publicering. Inget publicerades.",
      };
    }

    const commentary =
      (data.language === "en" ? post.copy_en : post.copy_sv) || post.copy_sv || post.copy_en || "";
    if (!commentary.trim()) throw new Error("LINKEDIN_COPY_REQUIRED");

    try {
      const result = await publishLinkedInTextPost({
        authorUrn: capability.resourceId,
        commentary,
      });

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
          .update({ status: "PUBLISHED" })
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
          linkedin_principal: capability.observedPrincipal,
          linkedin_resource_id: capability.resourceId,
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
