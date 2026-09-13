// Canonical ParkKey identity service (shared with CoreOS).
// These values are publishable browser configuration — never service-role secrets.
// Authorization is enforced by ParkKey Supabase Auth + CoreOS team_members + RLS,
// and additionally re-verified server-side in requireParkkeyAuth.
export const PARKKEY_AUTH_URL = "https://xoabfpxdqqlutxwjgqii.supabase.co";
export const PARKKEY_AUTH_PUBLISHABLE_KEY = "sb_publishable_Y1afZYB-ULMMdB_5y-21Aw_LYQxqFxl";

/** Storage key for the browser session. Same tenant as CoreOS, own storage slot. */
export const PARKKEY_AUTH_STORAGE_KEY = "parkkey-filmstudio-auth";

export function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

/**
 * New Supabase API keys are opaque strings, not bearer JWTs. PostgREST rejects them
 * in the Authorization header, so send them only as `apikey`.
 */
export function createParkkeyFetch(apiKey: string, bearerToken?: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(apiKey) && headers.get("Authorization") === `Bearer ${apiKey}`) {
      headers.delete("Authorization");
    }
    if (bearerToken) headers.set("Authorization", `Bearer ${bearerToken}`);
    headers.set("apikey", apiKey);
    return fetch(input, { ...init, headers });
  };
}
