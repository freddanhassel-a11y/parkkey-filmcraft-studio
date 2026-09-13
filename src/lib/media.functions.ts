import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { logAudit } from "./audit";

const BUCKET = "studio-media";

export const MEDIA_KINDS = ["image", "video", "audio", "document"] as const;
export const MEDIA_APPROVAL = ["DEMO", "PROPOSED", "APPROVED", "EXPORTED"] as const;
export const MEDIA_CATEGORIES = [
  "Logotyp",
  "Parky-referens",
  "Key art",
  "Bildreferens",
  "Videoreferens",
  "Musikreferens",
  "CTA-referens",
  "Brand asset",
  "Socialt material",
  "Filmleverans",
] as const;

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 512 * 1024 * 1024;

const ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/aac",
  "application/pdf",
];

function kindFromMime(mime: string): (typeof MEDIA_KINDS)[number] {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

function validateFile(mime: string, size: number) {
  if (!ALLOWED_MIME.includes(mime)) {
    throw new Error(`Filtypen ${mime || "okänd"} är inte tillåten i mediabiblioteket.`);
  }
  const kind = kindFromMime(mime);
  const limit = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (!Number.isFinite(size) || size <= 0) throw new Error("Filstorleken kunde inte läsas.");
  if (size > limit) {
    throw new Error(
      `Filen är ${(size / 1024 / 1024).toFixed(1)} MB. Maxgräns ${(limit / 1024 / 1024).toFixed(0)} MB för ${kind}.`,
    );
  }
  return kind;
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120) || "fil";
}

export const listMedia = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const [assets, versions, projects] = await Promise.all([
      context.db
        .from("media_assets")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
      context.db.from("media_versions").select("*").order("created_at", { ascending: false }),
      context.db.from("film_projects").select("id,title,status").order("title"),
    ]);
    if (assets.error) throw new Error(assets.error.message);
    return {
      assets: assets.data ?? [],
      versions: versions.data ?? [],
      projects: projects.data ?? [],
    };
  });

export const listArchivedMedia = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.db
      .from("media_assets")
      .select("*")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/**
 * Ger webbläsaren en tidsbegränsad, signerad uppladdningsadress till den privata
 * bucketen. Filen laddas aldrig upp via en publik URL och bucketen är stängd.
 */
export const createUploadTarget = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: { fileName: string; mimeType: string; size: number }) => d)
  .handler(async ({ data, context }) => {
    const kind = validateFile(data.mimeType, Number(data.size));
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName(data.fileName)}`;
    const { data: signed, error } = await context.db.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Kunde inte förbereda uppladdningen.");
    return { path, token: signed.token, signedUrl: signed.signedUrl, kind };
  });

export const registerMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator(
    (d: {
      name: string;
      storage_path: string;
      mime_type: string;
      file_size: number;
      width?: number | null;
      height?: number | null;
      duration_seconds?: number | null;
      category?: string;
      tags?: string[];
      usage_rights?: string | null;
      source_notes?: string | null;
      film_project_id?: string | null;
      campaign?: string | null;
      notes?: string | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const kind = validateFile(data.mime_type, Number(data.file_size));
    if (!data.name?.trim()) throw new Error("Namn krävs.");
    const { data: row, error } = await context.db
      .from("media_assets")
      .insert({
        name: data.name.trim(),
        kind,
        category: data.category ?? "Brand asset",
        mime_type: data.mime_type,
        storage_path: data.storage_path,
        file_size: Math.round(Number(data.file_size)),
        width: data.width ?? null,
        height: data.height ?? null,
        duration_seconds: data.duration_seconds ?? null,
        tags: data.tags ?? [],
        usage_rights: data.usage_rights ?? null,
        source_notes: data.source_notes ?? null,
        film_project_id: data.film_project_id ?? null,
        campaign: data.campaign ?? null,
        notes: data.notes ?? null,
        approval_status: "DEMO",
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await context.db.from("media_versions").insert({
      asset_id: row.id,
      version_label: "V1",
      storage_path: data.storage_path,
      file_size: Math.round(Number(data.file_size)),
      mime_type: data.mime_type,
      width: data.width ?? null,
      height: data.height ?? null,
      duration_seconds: data.duration_seconds ?? null,
      changelog: "Första uppladdning.",
      created_by: context.userId,
    });

    await logAudit(
      context.db,
      context,
      "media.upload",
      { type: "media_asset", id: row.id },
      {
        name: row.name,
        kind,
        size: data.file_size,
      },
    );
    return row;
  });

export const addMediaVersion = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator(
    (d: {
      asset_id: string;
      storage_path: string;
      mime_type: string;
      file_size: number;
      width?: number | null;
      height?: number | null;
      duration_seconds?: number | null;
      changelog?: string | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    validateFile(data.mime_type, Number(data.file_size));
    const existing = await context.db
      .from("media_versions")
      .select("id")
      .eq("asset_id", data.asset_id);
    const label = `V${(existing.data?.length ?? 0) + 1}`;
    const { data: row, error } = await context.db
      .from("media_versions")
      .insert({
        asset_id: data.asset_id,
        version_label: label,
        storage_path: data.storage_path,
        mime_type: data.mime_type,
        file_size: Math.round(Number(data.file_size)),
        width: data.width ?? null,
        height: data.height ?? null,
        duration_seconds: data.duration_seconds ?? null,
        changelog: data.changelog ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await context.db
      .from("media_assets")
      .update({
        storage_path: data.storage_path,
        mime_type: data.mime_type,
        file_size: Math.round(Number(data.file_size)),
        width: data.width ?? null,
        height: data.height ?? null,
        duration_seconds: data.duration_seconds ?? null,
      })
      .eq("id", data.asset_id);

    await logAudit(
      context.db,
      context,
      "media.version",
      { type: "media_asset", id: data.asset_id },
      {
        version: label,
      },
    );
    return row;
  });

export const updateMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator(
    (d: {
      id: string;
      name?: string;
      category?: string;
      tags?: string[];
      usage_rights?: string | null;
      source_notes?: string | null;
      approval_status?: string;
      film_project_id?: string | null;
      campaign?: string | null;
      notes?: string | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    if (rest.approval_status && !MEDIA_APPROVAL.includes(rest.approval_status as never)) {
      throw new Error("Ogiltig sanningsstatus.");
    }
    const patch = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined),
    ) as Partial<{
      name: string;
      category: string;
      tags: string[];
      usage_rights: string | null;
      source_notes: string | null;
      approval_status: string;
      film_project_id: string | null;
      campaign: string | null;
      notes: string | null;
    }>;
    const { data: row, error } = await context.db
      .from("media_assets")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await logAudit(context.db, context, "media.update", { type: "media_asset", id }, patch);
    return row;
  });

export const archiveMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: { id: string; restore?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.db
      .from("media_assets")
      .update({ archived_at: data.restore ? null : new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(
      context.db,
      context,
      "media.archive",
      { type: "media_asset", id: data.id },
      {
        restore: Boolean(data.restore),
      },
    );
    return { ok: true };
  });

/** Signerad, tidsbegränsad länk för förhandsvisning eller nedladdning. Inga publika filer. */
export const getMediaLink = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: { path: string; download?: boolean; expiresIn?: number }) => d)
  .handler(async ({ data, context }) => {
    const expiresIn = Math.min(Math.max(Number(data.expiresIn ?? 900), 60), 60 * 60 * 24 * 7);
    const { data: signed, error } = await context.db.storage
      .from(BUCKET)
      .createSignedUrl(data.path, expiresIn, data.download ? { download: true } : undefined);
    if (error || !signed) throw new Error(error?.message ?? "Kunde inte skapa länk.");
    await logAudit(
      context.db,
      context,
      "media.preview",
      { type: "storage_object" },
      {
        path: data.path,
        download: Boolean(data.download),
        expiresIn,
      },
    );
    return { url: signed.signedUrl, expiresIn };
  });
