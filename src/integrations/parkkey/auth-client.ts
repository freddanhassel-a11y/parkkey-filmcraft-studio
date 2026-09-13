import { createClient } from "@supabase/supabase-js";

import {
  PARKKEY_AUTH_PUBLISHABLE_KEY,
  PARKKEY_AUTH_STORAGE_KEY,
  PARKKEY_AUTH_URL,
  createParkkeyFetch,
} from "./runtime-config";

/**
 * Browser client for the shared ParkKey identity service (same tenant as CoreOS).
 * Used ONLY for authentication, team membership verification and password setup.
 * Film Studio data is never read from the browser — it goes through server functions.
 */
export const parkkeyAuth = createClient(PARKKEY_AUTH_URL, PARKKEY_AUTH_PUBLISHABLE_KEY, {
  auth: {
    storageKey: PARKKEY_AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  global: { fetch: createParkkeyFetch(PARKKEY_AUTH_PUBLISHABLE_KEY) },
});

export type ParkkeyTeamMember = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  title: string | null;
  status: "pending" | "approved" | "suspended";
};

/**
 * Mirrors the CoreOS first-login flow: the database function only links the current
 * auth user when an administrator pre-approved the e-mail in CoreOS.
 */
export async function claimAndReadMembership(): Promise<{
  member: ParkkeyTeamMember | null;
  verifyFailed: boolean;
}> {
  try {
    const claim = await (
      parkkeyAuth.rpc as unknown as (fn: string) => Promise<{ error: { message?: string } | null }>
    )("claim_preapproved_team_member");
    if (claim.error) throw new Error(claim.error.message ?? "Team claim failed");

    const { data, error } = await parkkeyAuth
      .from("team_members")
      .select("id,user_id,full_name,email,title,status")
      .maybeSingle();
    if (error) throw error;
    return { member: (data as ParkkeyTeamMember | null) ?? null, verifyFailed: false };
  } catch (error) {
    console.error("[ParkKey auth] team membership verification failed", error);
    return { member: null, verifyFailed: true };
  }
}
