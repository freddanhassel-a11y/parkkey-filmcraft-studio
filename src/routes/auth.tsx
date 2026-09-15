import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { parkkeyAuth } from "@/integrations/parkkey/auth-client";
import { StudioWordmark } from "@/components/studio/brand";

const COREOS_AUTH_URL = "https://core.parkkey.org/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "CoreOS-inloggning — ParkKey™ Film Studio" },
      {
        name: "description",
        content: "Film Studio använder endast ParkKey CoreOS-inloggningen och godkänt teammedlemskap.",
      },
      { name: "robots", content: "noindex,nofollow,noarchive" },
    ],
  }),
  component: AuthPage,
});

function handoffTokens() {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("pk_access_token");
  const refreshToken = params.get("pk_refresh_token");
  return accessToken && refreshToken ? { access_token: accessToken, refresh_token: refreshToken } : null;
}

function coreosLoginUrl() {
  const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  return `${COREOS_AUTH_URL}?next=${encodeURIComponent(returnUrl)}`;
}

function AuthPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifierar CoreOS-session…");

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const handoff = handoffTokens();
        if (handoff) {
          setStatus("Tar emot säker CoreOS-session…");
          const { error } = await parkkeyAuth.auth.setSession(handoff);
          if (error) throw error;
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        }

        const { data, error } = await parkkeyAuth.auth.getSession();
        if (error) throw error;
        if (data.session) {
          const verified = await parkkeyAuth.auth.getUser();
          if (verified.error || !verified.data.user) throw verified.error ?? new Error("CoreOS-sessionen kunde inte verifieras.");
          if (active) await navigate({ to: "/studio", replace: true });
          return;
        }

        setStatus("Ingen Studio-inloggning behövs. Öppnar CoreOS…");
        window.location.replace(coreosLoginUrl());
      } catch (error) {
        console.error("[Film Studio SSO] handoff failed", error);
        setStatus("CoreOS-sessionen kunde inte verifieras. Öppnar CoreOS på nytt…");
        window.setTimeout(() => window.location.replace(coreosLoginUrl()), 900);
      }
    })();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="surface-cinematic flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-xl">
        <StudioWordmark className="text-sm" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">CoreOS är din inloggning</h1>
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          {status}
        </p>
        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          Film Studio har inget separat lösenord, ingen separat kontoaktivering och ingen egen lösenordsåterställning. Åtkomst kräver en giltig CoreOS-session och godkänt ParkKey-teammedlemskap.
        </p>
      </div>
    </main>
  );
}
