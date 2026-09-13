import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { KeyRound, ShieldCheck } from "lucide-react";

import { parkkeyAuth } from "@/integrations/parkkey/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StudioWordmark } from "@/components/studio/brand";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Logga in — ParkKey™ Film Studio" },
      {
        name: "description",
        content:
          "Logga in i ParkKey™ Film Studio med ditt ParkKey-konto — samma inloggning som CoreOS.",
      },
      { property: "og:title", content: "Logga in — ParkKey™ Film Studio" },
      {
        property: "og:description",
        content: "Skyddad ParkKey-arbetsyta för film, socialt material, kundmaterial och QA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    void parkkeyAuth.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/studio" });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await parkkeyAuth.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      navigate({ to: "/studio" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Inloggningen misslyckades.");
    } finally {
      setBusy(false);
    }
  }

  async function sendReset() {
    if (!email.trim()) {
      toast.error("Fyll i din e-postadress först.");
      return;
    }
    setResetting(true);
    try {
      const { error } = await parkkeyAuth.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success("Återställningslänk skickad om adressen finns i ParkKey-teamet.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunde inte skicka återställning.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <main className="surface-cinematic flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-xl">
        <StudioWordmark className="text-sm" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Logga in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Använd ditt ParkKey-konto — samma inloggning som i CoreOS. Nya konton skapas av en
          administratör i CoreOS, inte här.
        </p>

        <form onSubmit={signIn} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-post</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Lösenord</Label>
            <div className="relative">
              <KeyRound
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Loggar in…" : "Logga in"}
          </Button>
        </form>

        <Button
          variant="ghost"
          className="mt-2 w-full"
          onClick={() => void sendReset()}
          disabled={resetting}
        >
          {resetting ? "Skickar…" : "Glömt lösenord"}
        </Button>

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          Behörighet styrs av godkänt ParkKey-teammedlemskap i CoreOS och kontrolleras på servern
          vid varje anrop.
        </p>
      </div>
    </main>
  );
}
