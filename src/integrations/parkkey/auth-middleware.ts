import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  PARKKEY_AUTH_PUBLISHABLE_KEY,
  PARKKEY_AUTH_URL,
  createParkkeyFetch,
} from "./runtime-config";

// CoreOS-schemat genereras inte i det här projektet — klienten är avsiktligt otypad.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CoreosClient = SupabaseClient<any, "public", any>;

function coreosClientFor(token: string): CoreosClient {
  return createClient(PARKKEY_AUTH_URL, PARKKEY_AUTH_PUBLISHABLE_KEY, {
    global: {
      fetch: createParkkeyFetch(PARKKEY_AUTH_PUBLISHABLE_KEY, token),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  }) as CoreosClient;
}

/**
 * Server-side authorization boundary for the whole Film Studio.
 *
 * 1. Requires a bearer token issued by the shared ParkKey identity service.
 * 2. Re-validates the token against that service (getUser revalidates server-side).
 * 3. Requires an approved CoreOS team_members row for that user.
 * 4. Only then exposes a Film Studio database client. Film Studio tables have no
 *    anon/authenticated grants at all, so the browser can never read them directly.
 */
export const requireParkkeyAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    const authHeader = request?.headers?.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Response("Unauthorized", { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length).trim();
    if (token.split(".").length !== 3) {
      throw new Response("Unauthorized", { status: 401 });
    }

    const coreos = coreosClientFor(token);
    const { data: userData, error: userError } = await coreos.auth.getUser(token);
    if (userError || !userData?.user) {
      throw new Response("Unauthorized", { status: 401 });
    }
    const user = userData.user;

    const membership = await coreos
      .from("team_members")
      .select("id,full_name,email,title,status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership.error) {
      throw new Response("Behörigheten kunde inte verifieras mot CoreOS just nu.", { status: 503 });
    }
    const member = membership.data as {
      id: string;
      full_name: string;
      email: string;
      title: string | null;
      status: string;
    } | null;
    if (!member || member.status !== "approved") {
      throw new Response("Forbidden: ingen godkänd ParkKey-teambehörighet.", { status: 403 });
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    return next({
      context: {
        db: supabaseAdmin,
        coreos,
        userId: user.id,
        email: user.email ?? member.email,
        member,
      },
    });
  },
);
