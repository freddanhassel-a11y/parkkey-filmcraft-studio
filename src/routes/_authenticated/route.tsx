import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { parkkeyAuth } from "@/integrations/parkkey/auth-client";
import { ParkkeySessionProvider, useParkkeySession } from "@/lib/parkkey-session";
import { PasswordSetupGate } from "@/components/studio/PasswordSetupGate";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await parkkeyAuth.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => (
    <ParkkeySessionProvider>
      <MembershipGate>
        <PasswordSetupGate>
          <Outlet />
        </PasswordSetupGate>
      </MembershipGate>
    </ParkkeySessionProvider>
  ),
});

/**
 * UX-grind. Den riktiga behörigheten avgörs serverside i requireParkkeyAuth
 * (godkänd CoreOS-teammedlem) — den här skärmen förklarar bara läget.
 */
function MembershipGate({ children }: { children: React.ReactNode }) {
  const { loading, approved, member, accessError, user, signOut } = useParkkeySession();
  const accountLabel = user?.email?.trim() || "det inloggade kontot";

  if (loading) {
    return (
      <main className="surface-cinematic flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-muted-foreground" role="status">
          Verifierar ParkKey-behörighet…
        </p>
      </main>
    );
  }

  if (approved) return <>{children}</>;

  return (
    <main className="surface-cinematic flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-xl">
        <ShieldAlert aria-hidden="true" className="size-6 text-muted-foreground" />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Behörighet krävs</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {accessError
            ? accessError
            : member
              ? `Ditt ParkKey-konto (${accountLabel}) har status ${member.status}. En administratör i CoreOS måste godkänna dig innan studion öppnas.`
              : `Kontot ${accountLabel} är inte godkänt i ParkKey-teamet. Be en administratör förbereda e-postadressen i CoreOS.`}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Film Studio använder samma inloggning och samma godkännanden som CoreOS. Ingen separat
          lösenordsdatabas finns här.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => void signOut()}>
          Logga ut
        </Button>
      </div>
    </main>
  );
}
