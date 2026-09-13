type LinkedInPublishResult = {
  postUrn: string;
  status: number;
};

export type LinkedInRuntimeReadiness = {
  configured: boolean;
  apiVersion: string;
  note: string;
};

const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";
const URN_RE = /^urn:li:(person|organization):[A-Za-z0-9_-]+$/;

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function apiVersion(): string {
  return env("LINKEDIN_API_VERSION") ?? "202608";
}

function redactProviderText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer [REDACTED]")
    .replace(/"access_token"\s*:\s*"[^"]+"/gi, '"access_token":"[REDACTED]"')
    .replace(/"refresh_token"\s*:\s*"[^"]+"/gi, '"refresh_token":"[REDACTED]"')
    .slice(0, 800);
}

export function getLinkedInRuntimeReadiness(): LinkedInRuntimeReadiness {
  const token = env("LINKEDIN_ACCESS_TOKEN");
  return {
    configured: Boolean(token),
    apiVersion: apiVersion(),
    note: token
      ? "Server-side LinkedIn Posts API transport is configured. CONNECTED still requires verified CoreOS capability and a real provider response."
      : "LINKEDIN_ACCESS_TOKEN is not configured in the production runtime. OAuth consent/setup is still required.",
  };
}

/**
 * Publishes a text-only LinkedIn post through the current Posts API.
 *
 * This adapter is intentionally fail-closed:
 * - access token is server-only;
 * - author must be a person/organization URN already verified by CoreOS;
 * - success requires HTTP 201 AND LinkedIn's x-restli-id response header;
 * - media is not silently omitted; callers must block media posts until a media
 *   upload adapter is implemented.
 */
export async function publishLinkedInTextPost(input: {
  authorUrn: string;
  commentary: string;
}): Promise<LinkedInPublishResult> {
  const token = env("LINKEDIN_ACCESS_TOKEN");
  if (!token) throw new Error("LINKEDIN_CONNECTION_REQUIRED");

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
