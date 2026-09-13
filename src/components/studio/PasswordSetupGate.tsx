import { useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { parkkeyAuth } from "@/integrations/parkkey/auth-client";
import { useParkkeySession } from "@/lib/parkkey-session";
import {
  PASSWORD_RULE_TEXT,
  checkPassword,
  hasPersonalPassword,
  passwordError,
} from "@/lib/password-policy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={ok ? "text-primary" : "text-muted-foreground"}>
      {ok ? "✓" : "•"} {text}
    </li>
  );
}

/** Vid första inloggningen måste användaren välja ett personligt lösenord (samma regel som CoreOS). */
export function PasswordSetupGate({ children }: { children: React.ReactNode }) {
  const { user, refresh, signOut } = useParkkeySession();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const needsSetup = !!user && !hasPersonalPassword(user.user_metadata as Record<string, unknown>);
  if (!needsSetup) return <>{children}</>;

  const check = checkPassword(password);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const err = passwordError(password);
    if (err) {
      toast.error(err);
      return;
    }
    if (password !== confirm) {
      toast.error("Lösenorden matchar inte.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await parkkeyAuth.auth.updateUser({
        password,
        data: { password_set: true },
      });
      if (error) throw error;
      toast.success("Personligt lösenord sparat.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunde inte spara lösenordet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="surface-cinematic flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-xl">
        <h1 className="text-2xl font-semibold tracking-tight">Välj personligt lösenord</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Det här är din första inloggning som <span className="font-medium">{user?.email}</span>.
          Välj ett eget lösenord innan studion öppnas.
        </p>

        <form onSubmit={save} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Nytt lösenord</Label>
            <div className="relative">
              <KeyRound
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="new-password"
                type={show ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-11"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Dölj lösenord" : "Visa lösenord"}
                aria-pressed={show}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Bekräfta lösenord</Label>
            <Input
              id="confirm-password"
              type={show ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <ul className="space-y-0.5 text-xs leading-relaxed">
            <Rule ok={check.longEnough} text="Minst 6 tecken" />
            <Rule ok={check.hasLetter} text="Minst en bokstav" />
            <Rule ok={check.hasDigit} text="Minst en siffra" />
          </ul>

          <Button
            type="submit"
            className="w-full"
            disabled={busy || !check.valid || password !== confirm}
          >
            Spara lösenord och fortsätt
          </Button>
        </form>

        <Button variant="outline" className="mt-3 w-full" onClick={() => void signOut()}>
          Logga ut
        </Button>

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {PASSWORD_RULE_TEXT} Lösenordet sparas krypterat i ParkKeys identitetstjänst — samma konto
          som i CoreOS, aldrig i studions egna tabeller.
        </p>
      </div>
    </main>
  );
}
