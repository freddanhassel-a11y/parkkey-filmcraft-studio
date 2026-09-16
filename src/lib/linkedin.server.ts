type LinkedInPublishResult = {
  postUrn: string;
  status: number;
};

export type LinkedInRuntimeReadiness = {
  configured: boolean;
  oauthAppConfigured: boolean;
  apiVersion: string;
  missingEnvironment: string[];
  note: string;
};

export type LinkedInMemberIdentity = {
  id: string;
  urn: string;
};

export type LinkedInImageUploadResult = {
  imageUrn: string;
};

const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";
const LINKEDIN_IMAGES_URL = "https://api.linkedin.com/rest/images?action=initializeUpload";
const LINKEDIN_ME_URL = "https://api.linkedin.com/v2/me";
const URN_RE = /^urn:li:(person|organization):[A-Za-z0-9_-]+$/;
const IMAGE_URN_RE = /^urn:li:image:[A-Za-z0-9_-]+$/;
const MEMBER_ID_RE = /^[A-Za-z0-9_-]+$/;
const LINKEDIN_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/gif"]);

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function apiVersion(): string {
  return env("LINKEDIN_API_VERSION") ?? "202608";
}

function providerHeaders(token: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
    "X-Restli-Protocol-Version": "2.0.0",
    "Linkedin-Version": apiVersion(),
  };
}

function redactProviderText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+/gi, "Bearer [REDACTED]")
    .replace(/"access_token"\s*:\s*"[^"]+"/gi, '"access_token":"[REDACTED]"')
    .replace(/"refresh_token"\s*:\s*"[^"]+"/gi, '"refresh_token":"[REDACTED]"')
    .slice(0, 800);
}

async function providerFailure(prefix: string, response: Response): Promise<Error> {
  const providerBody = redactProviderText(await response.text().catch(() => ""));
  return new Error(`${prefix}:${response.status}:${providerBody || "No provider error body"}`);
}

function requireAccessToken(): string {
  const token = env("LINKEDIN_ACCESS_TOKEN");
  if (!token) throw new Error("LINKEDIN_CONNECTION_REQUIRED");
  return token;
}

function requireAuthorUrn(value: string): string {
  const urn = value.trim();
  if (!URN_RE.test(urn)) throw new Error("LINKEDIN_INVALID_AUTHOR_URN");
  return urn;
}

export function getLinkedInRuntimeReadiness(): LinkedInRuntimeReadiness {
  const token = env("LINKEDIN_ACCESS_TOKEN");
  const clientId = env("LINKEDIN_CLIENT_ID");
  const clientSecret = env("LINKEDIN_CLIENT_SECRET");
  const redirectUri = env("LINKEDIN_REDIRECT_URI");
  const missingEnvironment = [
    ...(!clientId ? ["LINKEDIN_CLIENT_ID"] : []),
    ...(!clientSecret ? ["LINKEDIN_CLIENT_SECRET"] : []),
    ...(!redirectUri ? ["LINKEDIN_REDIRECT_URI"] : []),
    ...(!token ? ["LINKEDIN_ACCESS_TOKEN"] : []),
  ];
  const oauthAppConfigured = Boolean(clientId && clientSecret && redirectUri);

  return {
    configured: Boolean(token),
    oauthAppConfigured,
    apiVersion: apiVersion(),
    missingEnvironment,
    note: token
      ? "Server-side LinkedIn transport is configured. Film Studio verifies the authenticated member directly with LinkedIn before publishing."
      : oauthAppConfigured
        ? "LinkedIn OAuth-appens serverinställningar finns, men LINKEDIN_ACCESS_TOKEN saknas. Slutför LinkedIns member-consent och lagra token server-side innan publicering aktiveras."
        : `LinkedIn OAuth är inte färdigkonfigurerat server-side. Saknas: ${missingEnvironment.join(", ")}.`,
  };
}

export async function getLinkedInCurrentMemberIdentity(): Promise<LinkedInMemberIdentity> {
  const token = requireAccessToken();
  const response = await fetch(LINKEDIN_ME_URL, {
    method: "GET",
    headers: providerHeaders(token),
  });

  if (!response.ok) throw await providerFailure("LINKEDIN_IDENTITY_FAILED", response);

  const body = (await response.json()) as { id?: unknown };
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id || !MEMBER_ID_RE.test(id)) throw new Error("LINKEDIN_INVALID_MEMBER_ID");

  return { id, urn: `urn:li:person:${id}` };
}

/** Initializes and uploads one image to LinkedIn's Images API. */
export async function uploadLinkedInImage(input: {
  ownerUrn: string;
  bytes: ArrayBuffer;
  mimeType: string;
}): Promise<LinkedInImageUploadResult> {
  const token = requireAccessToken();
  const ownerUrn = requireAuthorUrn(input.ownerUrn);
  const mimeType = input.mimeType.trim().toLowerCase();
  if (!LINKEDIN_IMAGE_MIME.has(mimeType)) {
    throw new Error(`LINKEDIN_UNSUPPORTED_IMAGE_MIME:${mimeType || "unknown"}`);
  }
  if (input.bytes.byteLength <= 0) throw new Error("LINKEDIN_EMPTY_IMAGE");

  const initialize = await fetch(LINKEDIN_IMAGES_URL, {
    method: "POST",
    headers: providerHeaders(token, true),
    body: JSON.stringify({ initializeUploadRequest: { owner: ownerUrn } }),
  });
  if (!initialize.ok) throw await providerFailure("LINKEDIN_IMAGE_INIT_FAILED", initialize);

  const body = (await initialize.json()) as {
    value?: { uploadUrl?: unknown; image?: unknown };
  };
  const uploadUrl = typeof body.value?.uploadUrl === "string" ? body.value.uploadUrl.trim() : "";
  const imageUrn = typeof body.value?.image === "string" ? body.value.image.trim() : "";
  if (!uploadUrl || !IMAGE_URN_RE.test(imageUrn)) {
    throw new Error("LINKEDIN_IMAGE_INIT_INVALID_RESPONSE");
  }

  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: input.bytes,
  });
  if (!upload.ok) throw await providerFailure("LINKEDIN_IMAGE_UPLOAD_FAILED", upload);

  return { imageUrn };
}

async function publishLinkedInPostBody(body: Record<string, unknown>): Promise<LinkedInPublishResult> {
  const token = requireAccessToken();
  const response = await fetch(LINKEDIN_POSTS_URL, {
    method: "POST",
    headers: providerHeaders(token, true),
    body: JSON.stringify(body),
  });

  const postUrn = response.headers.get("x-restli-id")?.trim() ?? "";
  if (response.status !== 201 || !postUrn) {
    throw await providerFailure("LINKEDIN_PUBLISH_FAILED", response);
  }
  return { postUrn, status: response.status };
}

/** Publishes a text-only LinkedIn post and requires provider evidence. */
export async function publishLinkedInTextPost(input: {
  authorUrn: string;
  commentary: string;
}): Promise<LinkedInPublishResult> {
  const authorUrn = requireAuthorUrn(input.authorUrn);
  const commentary = input.commentary.trim();
  if (!commentary) throw new Error("LINKEDIN_EMPTY_COMMENTARY");

  return publishLinkedInPostBody({
    author: authorUrn,
    commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  });
}

/** Publishes a LinkedIn image post and requires both media and post provider evidence. */
export async function publishLinkedInImagePost(input: {
  authorUrn: string;
  commentary: string;
  imageUrn: string;
  altText: string;
}): Promise<LinkedInPublishResult> {
  const authorUrn = requireAuthorUrn(input.authorUrn);
  const commentary = input.commentary.trim();
  const imageUrn = input.imageUrn.trim();
  if (!commentary) throw new Error("LINKEDIN_EMPTY_COMMENTARY");
  if (!IMAGE_URN_RE.test(imageUrn)) throw new Error("LINKEDIN_INVALID_IMAGE_URN");

  return publishLinkedInPostBody({
    author: authorUrn,
    commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    content: {
      media: {
        id: imageUrn,
        altText: input.altText.trim().slice(0, 4000),
      },
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  });
}
