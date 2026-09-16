import {
  getLinkedInCurrentMemberIdentity,
  getLinkedInRuntimeReadiness,
  publishLinkedInImagePost,
  publishLinkedInTextPost,
  uploadLinkedInImage,
} from "./linkedin.server";

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const TRUSTED_MEDIA_HOST = "xoabfpxdqqlutxwjgqii.supabase.co";
const LINKEDIN_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/gif"]);

type PublishPayload = {
  commentary: string;
  authorUrn?: string | null;
  imageUrl?: string | null;
  imageMimeType?: string | null;
  altText?: string | null;
};

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function secretsMatch(left: string, right: string): Promise<boolean> {
  if (!left || !right) return false;
  const [a, b] = await Promise.all([digest(left), digest(right)]);
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function validAuthorUrn(value: string): boolean {
  return /^urn:li:(person|organization):[A-Za-z0-9_-]+$/.test(value);
}

function validateMediaUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== TRUSTED_MEDIA_HOST) {
    throw new Error("UNTRUSTED_MEDIA_URL");
  }
  if (!url.pathname.startsWith("/storage/v1/object/")) {
    throw new Error("UNTRUSTED_MEDIA_PATH");
  }
  return url;
}

/**
 * Least-privilege publish gateway used by the CoreOS cron orchestrator.
 * Film Studio never receives database-admin credentials. CoreOS supplies only
 * the already-approved copy, optional verified author URN and a short-lived
 * signed media URL. PUBLISHED truth is returned only after LinkedIn provider evidence.
 */
export async function handleCoreosLinkedInPublish(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const expectedSecret = process.env["COREOS_CRON_SECRET"]?.trim() ?? "";
  const suppliedSecret = request.headers.get("x-coreos-cron-secret")?.trim() ?? "";
  if (!(await secretsMatch(expectedSecret, suppliedSecret))) {
    return json({ error: "UNAUTHORIZED" }, 401);
  }

  const runtime = getLinkedInRuntimeReadiness();
  if (!runtime.configured) return json({ error: "LINKEDIN_CONNECTION_REQUIRED" }, 503);

  let payload: PublishPayload;
  try {
    payload = (await request.json()) as PublishPayload;
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const commentary = payload.commentary?.trim() ?? "";
  if (!commentary) return json({ error: "LINKEDIN_COPY_REQUIRED" }, 400);

  try {
    let authorUrn = payload.authorUrn?.trim() ?? "";
    if (authorUrn && !validAuthorUrn(authorUrn)) throw new Error("LINKEDIN_INVALID_AUTHOR_URN");
    if (!authorUrn) authorUrn = (await getLinkedInCurrentMemberIdentity()).urn;

    let result: Awaited<ReturnType<typeof publishLinkedInTextPost>>;
    if (payload.imageUrl) {
      const mediaUrl = validateMediaUrl(payload.imageUrl);
      const requestedMime = payload.imageMimeType?.trim().toLowerCase() ?? "";
      if (!LINKEDIN_IMAGE_MIME.has(requestedMime)) {
        throw new Error(`LINKEDIN_UNSUPPORTED_IMAGE_MIME:${requestedMime || "unknown"}`);
      }

      const media = await fetch(mediaUrl.toString(), { redirect: "error" });
      if (!media.ok) throw new Error(`MEDIA_FETCH_FAILED:${media.status}`);
      const responseMime = media.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
      if (responseMime && responseMime !== requestedMime) {
        throw new Error(`MEDIA_MIME_MISMATCH:${responseMime}:${requestedMime}`);
      }
      const length = Number(media.headers.get("content-length") ?? "0");
      if (Number.isFinite(length) && length > MAX_IMAGE_BYTES) throw new Error("MEDIA_TOO_LARGE");
      const bytes = await media.arrayBuffer();
      if (bytes.byteLength <= 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
        throw new Error("MEDIA_SIZE_INVALID");
      }

      const uploaded = await uploadLinkedInImage({
        ownerUrn: authorUrn,
        bytes,
        mimeType: requestedMime,
      });
      result = await publishLinkedInImagePost({
        authorUrn,
        commentary,
        imageUrn: uploaded.imageUrn,
        altText: payload.altText?.trim() ?? "",
      });
    } else {
      result = await publishLinkedInTextPost({ authorUrn, commentary });
    }

    return json({
      published: true,
      provider: "linkedin",
      postUrn: result.postUrn,
      providerStatus: result.status,
      authorUrn,
    });
  } catch (error) {
    const message = (error instanceof Error ? error.message : "LINKEDIN_PUBLISH_FAILED").slice(0, 900);
    return json({ published: false, error: message }, 502);
  }
}
