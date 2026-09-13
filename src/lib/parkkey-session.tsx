import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import {
  claimAndReadMembership,
  parkkeyAuth,
  type ParkkeyTeamMember,
} from "@/integrations/parkkey/auth-client";

type SessionState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  member: ParkkeyTeamMember | null;
  approved: boolean;
  accessError: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<SessionState | null>(null);

const VERIFY_MESSAGE =
  "ParkKey kunde inte verifiera din teambehörighet just nu. Försök igen när identitetstjänsten svarar.";

export function ParkkeySessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<ParkkeyTeamMember | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const sync = useCallback(async (next: Session | null) => {
    setSession(next);
    if (!next?.user?.id) {
      setMember(null);
      setAccessError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { member: found, verifyFailed } = await claimAndReadMembership();
    setMember(found);
    setAccessError(verifyFailed ? VERIFY_MESSAGE : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    const { data: sub } = parkkeyAuth.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      if (event === "SIGNED_OUT") {
        setSession(null);
        setMember(null);
        setAccessError(null);
        setLoading(false);
        return;
      }
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        setSession(next);
        setLoading(true);
        window.setTimeout(() => {
          if (active) void sync(next);
        }, 0);
      }
    });
    void parkkeyAuth.auth.getSession().then(({ data }) => {
      if (active) void sync(data.session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [sync]);

  const refresh = useCallback(async () => {
    const { data } = await parkkeyAuth.auth.getSession();
    await parkkeyAuth.auth.refreshSession().catch(() => undefined);
    const { data: after } = await parkkeyAuth.auth.getSession();
    await sync(after.session ?? data.session);
  }, [sync]);

  const signOut = useCallback(async () => {
    await parkkeyAuth.auth.signOut();
    setSession(null);
    setMember(null);
    setAccessError(null);
    setLoading(false);
  }, []);

  return (
    <Ctx.Provider
      value={{
        loading,
        session,
        user: session?.user ?? null,
        member,
        approved: member?.status === "approved" && !accessError,
        accessError,
        refresh,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useParkkeySession(): SessionState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useParkkeySession måste användas inuti ParkkeySessionProvider");
  return ctx;
}
