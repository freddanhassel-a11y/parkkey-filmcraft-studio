import { createClient } from "@supabase/supabase-js";

import {
  PARKKEY_AUTH_PUBLISHABLE_KEY,
  PARKKEY_AUTH_URL,
  createParkkeyFetch,
} from "./runtime-config";

export type VerifiedParkkeyUser = {
  userId: string;
  email: string;
  fullName: string;
};

/**
 * Samma behörighetsgräns som requireParkkeyAuth, men för raka HTTP-rutter
 * (server routes) där middleware för serverfunktioner inte gäller.
 *
 * Kastar Response med korrekt status — aldrig ett generiskt 500.
 */
export async function verifyParkkeyRequest(request: Request): Promise<VerifiedParkkeyUser> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response("Unauthorized", { status: 401 });
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (token.split(".").length !== 3) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const coreos = createClient(PARKKEY_AUTH_URL, PARKKEY_AUTH_PUBLISHABLE_KEY, {
    global: {
      fetch: createParkkeyFetch(PARKKEY_AUTH_PUBLISHABLE_KEY, token),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await coreos.auth.getUser(token);
  if (userError || !userData?.user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const membership = await coreos
    .from("team_members")
    .select("id,full_name,email,status")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (membership.error) {
    throw new Response("Behörigheten kunde inte verifieras mot CoreOS just nu.", { status: 503 });
  }
  const member = membership.data as {
    full_name: string | null;
    email: string | null;
    status: string;
  } | null;
  if (!member || member.status !== "approved") {
    throw new Response("Forbidden: ingen godkänd ParkKey-teambehörighet.", { status: 403 });
  }

  return {
    userId: userData.user.id,
    email: userData.user.email ?? member.email ?? "",
    fullName: member.full_name ?? "",
  };
}
