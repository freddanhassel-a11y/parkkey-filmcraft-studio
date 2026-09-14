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

async function readMembershipForUser(userId: string): Promise<ParkkeyTeamMember | null> {
  const { data, error } = await parkkeyAuth
    .from("team_members")
    .select("id,user_id,full_name,email,title,status")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ParkkeyTeamMember | null) ?? null;
}

/**
 * Mirrors the CoreOS first-login flow without making an already-linked member depend on
 * the claim RPC. Existing members are read first; the claim is only needed when an admin
 * pre-approved the e-mail but no auth user has been linked yet.
 */
export async function claimAndReadMembership(): Promise<{
  member: ParkkeyTeamMember | null;
  verifyFailed: boolean;
}> {
  try {
    const { data: userData, error: userError } = await parkkeyAuth.auth.getUser();
    if (userError || !userData.user?.id) {
      throw userError ?? new Error("Authenticated ParkKey user is missing");
    }

    const userId = userData.user.id;
    const existing = await readMembershipForUser(userId);
    if (existing) {
      return { member: existing, verifyFailed: false };
    }

    const claim = await (
      parkkeyAuth.rpc as unknown as (fn: string) => Promise<{ error: { message?: string } | null }>
    )("claim_preapproved_team_member");
    if (claim.error) throw new Error(claim.error.message ?? "Team claim failed");

    return { member: await readMembershipForUser(userId), verifyFailed: false };
  } catch (error) {
    console.error("[ParkKey auth] team membership verification failed", error);
    return { member: null, verifyFailed: true };
  }
}
