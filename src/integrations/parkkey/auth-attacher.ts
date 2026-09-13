import { createMiddleware } from "@tanstack/react-start";

import { parkkeyAuth } from "./auth-client";

/**
 * Client-side function middleware: attaches the shared ParkKey bearer token to
 * every server-function call. The server re-validates the token; the client never
 * decides authorization.
 */
export const attachParkkeyAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  let token: string | undefined;
  if (typeof window !== "undefined") {
    const { data } = await parkkeyAuth.auth.getSession();
    token = data.session?.access_token;
  }
  return next({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
});
