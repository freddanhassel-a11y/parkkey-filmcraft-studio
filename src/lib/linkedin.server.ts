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

const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";
const LINKEDIN_ME_URL = "https://api.linkedin.com/v2/me";
const URN_RE = /^urn:li:(person|organization):[A-Za-z0-9_-]+$/;
const MEMBER_ID_RE = /^[A-Za-z0-9_-]+$/;

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function apiVersion(): string {
  return env("LINKEDIN_API_VERSION") ?? "202608";
}

function redactProviderText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+/gi, "Bearer [REDACTED]")
    .replace(/"access_token"\s*:\s*"[^"]+"/gi, '"access_token":"[REDACTED]"')
    .replace(/"refresh_token"\s*:\s*"[^"]+"/gi, '"refresh_token":"[REDACTED]"')
    .slice(0, 800);
}

function requireAccessToken(): string {
  const token = env("LINKEDIN_ACCESS_TOKEN");
  if (!token) throw new Error("LINKEDIN_CONNECTION_REQUIRED");
  return token;
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
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (!response.ok) {
    const providerBody = redactProviderText(await response.text().catch(() => ""));
    throw new Error(
      `LINKEDIN_IDENTITY_FAILED:${response.status}:${providerBody || "No provider error body"}`,
    );
  }

  const body = (await response.json()) as { id?: unknown };
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id || !MEMBER_ID_RE.test(id)) throw new Error("LINKEDIN_INVALID_MEMBER_ID");

  return { id, urn: `urn:li:person:${id}` };
}

/**
 * Publishes a text-only LinkedIn post through the current Posts API.
 *
 * This adapter is intentionally fail-closed:
 * - access token is server-only;
 * - author must be a validated LinkedIn person/organization URN;
 * - success requires HTTP 201 AND LinkedIn's x-restli-id response header;
 * - media is not silently omitted; callers must block media posts until a media
 *   upload adapter is implemented.
 */
export async function publishLinkedInTextPost(input: {
  authorUrn: string;
  commentary: string;
}): Promise<LinkedInPublishResult> {
  const token = requireAccessToken();

  const authorUrn = input.authorUrn.trim();
  if (!URN_RE.test(authorUrn)) throw new Error("LINKEDIN_INVALID_AUTHOR_URN");

  const commentary = input.commentary.trim();
  if (!commentary) throw new Error("LINKEDIN_EMPTY_COMMENTARY");

  const response = await fetch(LINKEDIN_POSTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": apiVersion(),
    },
    body: JSON.stringify({
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
    }),
  });

  const postUrn = response.headers.get("x-restli-id")?.trim() ?? "";
  if (response.status !== 201 || !postUrn) {
    const providerBody = redactProviderText(await response.text().catch(() => ""));
    throw new Error(
      `LINKEDIN_PUBLISH_FAILED:${response.status}:${providerBody || "No provider error body"}`,
    );
  }

  return { postUrn, status: response.status };
}
