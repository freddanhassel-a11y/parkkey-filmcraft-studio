import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  getLinkedInCurrentMemberIdentity,
  getLinkedInRuntimeReadiness,
  publishLinkedInImagePost,
  publishLinkedInTextPost,
  uploadLinkedInImage,
} from "./linkedin.server";

const BUCKET = "studio-media";
const DUE_LIMIT = 12;
const READY_MEDIA_APPROVAL = new Set(["APPROVED", "EXPORTED"]);
const LINKEDIN_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/gif"]);

type ScheduleRow = {
  id: string;
  post_id: string;
  scheduled_at: string;
  status: string;
  created_by: string;
};

type PostRow = {
  id: string;
  network: string;
  status: string;
  copy_sv: string | null;
  copy_en: string | null;
  created_by: string;
};

type AssetLink = {
  media_asset_id: string;
  alt_text: string | null;
};

type MediaAsset = {
  id: string;
  kind: string;
  storage_path: string | null;
  mime_type: string | null;
  approval_status: string;
  name: string;
};

type SchedulerResult = {
  checked: number;
  published: number;
  blocked: number;
  failed: number;
};

function safeError(error: unknown): string {
  return (error instanceof Error ? error.message : "Okänt LinkedIn scheduler-fel").slice(0, 900);
}

async function setScheduleStatus(scheduleId: string, status: string, notes?: string) {
  const payload: { status: string; notes?: string } = { status };
  if (notes) payload.notes = notes.slice(0, 900);
  const result = await supabaseAdmin.from("social_schedules").update(payload).eq("id", scheduleId);
  if (result.error) throw new Error(result.error.message);
}

async function recordAttempt(input: {
  schedule: ScheduleRow;
  postId: string;
  status: string;
  error?: string | null;
}) {
  const latest = await supabaseAdmin
    .from("publish_attempts")
    .select("status,error_message")
    .eq("schedule_id", input.schedule.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    !latest.error &&
    latest.data?.status === input.status &&
    (latest.data.error_message ?? null) === (input.error ?? null)
  ) {
    return;
  }

  const inserted = await supabaseAdmin.from("publish_attempts").insert({
    post_id: input.postId,
    schedule_id: input.schedule.id,
    provider: "linkedin",
    status: input.status,
    error_message: input.error ?? null,
    attempted_by: input.schedule.created_by,
  });
  if (inserted.error) throw new Error(inserted.error.message);
}

async function resolveAuthorUrn(): Promise<string> {
  const integration = await supabaseAdmin
    .from("integration_accounts")
    .select(
      "expected_principal,observed_principal,expected_resource_id,status,granted_scopes,preflight_verified,last_verified_at,purpose",
    )
    .ilike("provider", "%linkedin%")
    .order("last_verified_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (!integration.error && integration.data?.status?.toLowerCase() === "connected") {
    const row = integration.data;
    const expected = row.expected_principal?.trim() ?? "";
    const observed = row.observed_principal?.trim() ?? "";
    const resource = row.expected_resource_id?.trim() ?? "";
    const principal = resource || observed || expected;
    const isOrganization = principal.startsWith("urn:li:organization:");
    const requiredScope = isOrganization ? "w_organization_social" : "w_member_social";
    const scopes = row.granted_scopes ?? [];
    const identityMatches = Boolean(observed && expected && observed.toLowerCase() === expected.toLowerCase());
    const purpose = row.purpose?.toLowerCase() ?? "";
    const publishingIntent = purpose.includes("publish") || purpose.includes("social");

    if (
      row.preflight_verified === true &&
      row.last_verified_at &&
      identityMatches &&
      publishingIntent &&
      scopes.some((scope) => scope.trim().toLowerCase() === requiredScope) &&
      /^urn:li:(person|organization):[A-Za-z0-9_-]+$/.test(principal)
    ) {
      return principal;
    }
  }

  const member = await getLinkedInCurrentMemberIdentity();
  return member.urn;
}

async function loadReadyImage(postId: string): Promise<{
  asset: MediaAsset;
  altText: string;
} | null> {
  const links = await supabaseAdmin
    .from("social_post_assets")
    .select("media_asset_id,alt_text")
    .eq("post_id", postId)
    .order("sort_order", { ascending: true });
  if (links.error) throw new Error(links.error.message);

  const rows = (links.data ?? []) as AssetLink[];
  if (rows.length === 0) return null;

  const assets = await supabaseAdmin
    .from("media_assets")
    .select("id,kind,storage_path,mime_type,approval_status,name")
    .in(
      "id",
      rows.map((row) => row.media_asset_id),
    );
  if (assets.error) throw new Error(assets.error.message);

  const byId = new Map(((assets.data ?? []) as MediaAsset[]).map((asset) => [asset.id, asset]));
  const candidates = rows
    .map((link) => ({ link, asset: byId.get(link.media_asset_id) }))
    .filter(
      (entry): entry is { link: AssetLink; asset: MediaAsset } =>
        Boolean(
          entry.asset?.storage_path &&
            entry.asset.mime_type &&
            entry.asset.kind === "image" &&
            LINKEDIN_IMAGE_MIME.has(entry.asset.mime_type.toLowerCase()) &&
            READY_MEDIA_APPROVAL.has(entry.asset.approval_status),
        ),
    );

  if (candidates.length === 0) {
    throw new Error("LINKEDIN_ASSET_REQUIRED");
  }
  if (candidates.length > 1) {
    throw new Error("LINKEDIN_SINGLE_APPROVED_IMAGE_REQUIRED");
  }

  return {
    asset: candidates[0].asset,
    altText: candidates[0].link.alt_text?.trim() || candidates[0].asset.name,
  };
}

async function publishDueSchedule(schedule: ScheduleRow): Promise<"published" | "blocked" | "failed"> {
  const postResult = await supabaseAdmin
    .from("social_posts")
    .select("id,network,status,copy_sv,copy_en,created_by")
    .eq("id", schedule.post_id)
    .single();
  if (postResult.error) throw new Error(postResult.error.message);
  const post = postResult.data as PostRow;

  if (post.network !== "LinkedIn") return "blocked";
  if (post.status === "PUBLISHED" || schedule.status === "PUBLISHED") return "published";
  if (!post.status.startsWith("SCHEDULED") && post.status !== "APPROVED") return "blocked";

  const runtime = getLinkedInRuntimeReadiness();
  if (!runtime.configured) {
    await setScheduleStatus(schedule.id, "SCHEDULED — CONNECTION REQUIRED", runtime.note);
    await recordAttempt({
      schedule,
      postId: post.id,
      status: "BLOCKED — CONNECTION REQUIRED",
      error: runtime.note,
    });
    return "blocked";
  }

  const commentary = (post.copy_sv || post.copy_en || "").trim();
  if (!commentary) {
    const message = "LinkedIn-copy saknas.";
    await setScheduleStatus(schedule.id, "SCHEDULED — COPY REQUIRED", message);
    await recordAttempt({ schedule, postId: post.id, status: "BLOCKED — COPY REQUIRED", error: message });
    return "blocked";
  }

  let image: Awaited<ReturnType<typeof loadReadyImage>>;
  try {
    image = await loadReadyImage(post.id);
  } catch (error) {
    const message = safeError(error);
    await setScheduleStatus(schedule.id, "SCHEDULED — ASSET REQUIRED", message);
    await recordAttempt({
      schedule,
      postId: post.id,
      status: "BLOCKED — ASSET REQUIRED",
      error: message,
    });
    return "blocked";
  }

  try {
    const authorUrn = await resolveAuthorUrn();
    let result: Awaited<ReturnType<typeof publishLinkedInTextPost>>;

    if (image) {
      const downloaded = await supabaseAdmin.storage.from(BUCKET).download(image.asset.storage_path!);
      if (downloaded.error || !downloaded.data) {
        throw new Error(`LINKEDIN_ASSET_DOWNLOAD_FAILED:${downloaded.error?.message ?? "missing file"}`);
      }
      const bytes = await downloaded.data.arrayBuffer();
      const uploaded = await uploadLinkedInImage({
        ownerUrn: authorUrn,
        bytes,
        mimeType: image.asset.mime_type!,
      });
      result = await publishLinkedInImagePost({
        authorUrn,
        commentary,
        imageUrn: uploaded.imageUrn,
        altText: image.altText,
      });
    } else {
      result = await publishLinkedInTextPost({ authorUrn, commentary });
    }

    const attempt = await supabaseAdmin.from("publish_attempts").insert({
      post_id: post.id,
      schedule_id: schedule.id,
      provider: "linkedin",
      status: "PUBLISHED",
      error_message: null,
      attempted_by: schedule.created_by || post.created_by,
    });
    if (attempt.error) throw new Error(attempt.error.message);

    const postUpdate = await supabaseAdmin
      .from("social_posts")
      .update({ status: "PUBLISHED" })
      .eq("id", post.id);
    if (postUpdate.error) throw new Error(postUpdate.error.message);

    const scheduleUpdate = await supabaseAdmin
      .from("social_schedules")
      .update({
        status: "PUBLISHED",
        notes: `LinkedIn provider confirmed ${result.postUrn} with HTTP ${result.status}.`,
      })
      .eq("id", schedule.id);
    if (scheduleUpdate.error) throw new Error(scheduleUpdate.error.message);

    return "published";
  } catch (error) {
    const message = safeError(error);
    await recordAttempt({ schedule, postId: post.id, status: "FAILED", error: message });
    await setScheduleStatus(schedule.id, "SCHEDULED — PROVIDER RETRY", message);
    return "failed";
  }
}

/** Runs from Cloudflare Scheduled Events. Never marks PUBLISHED without LinkedIn provider evidence. */
export async function runDueLinkedInScheduler(now = new Date()): Promise<SchedulerResult> {
  const schedules = await supabaseAdmin
    .from("social_schedules")
    .select("id,post_id,scheduled_at,status,created_by")
    .like("status", "SCHEDULED%")
    .lte("scheduled_at", now.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(DUE_LIMIT);
  if (schedules.error) throw new Error(schedules.error.message);

  const result: SchedulerResult = { checked: 0, published: 0, blocked: 0, failed: 0 };
  for (const row of (schedules.data ?? []) as ScheduleRow[]) {
    result.checked += 1;
    const outcome = await publishDueSchedule(row);
    result[outcome] += 1;
  }
  return result;
}
