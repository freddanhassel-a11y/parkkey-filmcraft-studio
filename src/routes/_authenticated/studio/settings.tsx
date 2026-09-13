import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, Linkedin, LogOut, PlugZap, ShieldCheck } from "lucide-react";

import { listIntegrations, verifyIntegration } from "@/lib/integrations.functions";
import { useParkkeySession } from "@/lib/parkkey-session";
import { SectionHeading } from "@/components/studio/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/studio/settings")({
  head: () => ({
    meta: [
      { title: "Inställningar — ParkKey™ Film Studio" },
      {
        name: "description",
        content:
          "Konto, delad ParkKey-inloggning, anslutningar och LinkedIn-uppkoppling för ParkKey Film Studio.",
      },
      { property: "og:title", content: "Inställningar — ParkKey™ Film Studio" },
      {
        property: "og:description",
        content: "Kontoinställningar och anslutningsstatus för ParkKey Film Studio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const LINKEDIN_STEPS = [
  "Skapa en LinkedIn-app kopplad till ParkKeys företagssida.",
  "Aktivera rättigheterna w_member_social och r_liteprofile (eller organisationsmotsvarigheten).",
  "Ange callback-adressen för ParkKey Film Studio i LinkedIn-appen.",
  "Lägg nyckeln i projektets hemligheter som LINKEDIN_API_KEY — aldrig i webbläsarkod.",
  "Kör Verifiera nedan; status måste bli CONNECTED innan något kan publiceras.",
];

function tone(status: string) {
  if (status === "CONNECTED") return "border-status-verified/50 text-status-verified";
  if (status === "ERROR") return "border-status-error/50 text-status-error";
  return "border-status-unknown/40 text-status-unknown";
}

function SettingsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user, member, signOut } = useParkkeySession();
  const fetchIntegrations = useServerFn(listIntegrations);
  const verify = useServerFn(verifyIntegration);
  const { data, isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchIntegrations(),
  });

  const linkedin = (data?.connections ?? []).find((c) => c.provider === "linkedin");

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Inställningar"
        title="Konto och anslutningar"
        description="Film Studio använder samma ParkKey-konto som CoreOS. Inga lösenord lagras i studions egna tabeller och inga nycklar finns i webbläsaren."
      />

      <section aria-label="Konto" className="surface-glass space-y-3 rounded-xl p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          <KeyRound aria-hidden="true" className="size-4" />
          Konto
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">E-post</dt>
            <dd className="text-sm font-medium">{user?.email ?? "Okänd"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Teambehörighet</dt>
            <dd className="text-sm font-medium">{member?.status ?? "Okänd"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Identitet</dt>
            <dd className="text-sm">
              ParkKeys gemensamma identitetstjänst — samma konto som i CoreOS. Behörigheten läses
              från CoreOS teamregister vid varje serveranrop.
            </dd>
          </div>
        </dl>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void signOut().then(() => navigate({ to: "/auth" }))}
        >
          <LogOut aria-hidden="true" />
          Logga ut
        </Button>
      </section>

      <section aria-label="Anslut LinkedIn" className="surface-glass space-y-4 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            <Linkedin aria-hidden="true" className="size-4" />
            Anslut LinkedIn
          </h2>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${tone(linkedin?.status ?? "NOT CONNECTED")}`}
          >
            {isLoading ? "Kontrollerar…" : (linkedin?.status ?? "NOT CONNECTED")}
          </span>
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground">
          {LINKEDIN_STEPS.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="text-xs font-semibold text-primary">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              void verify({ data: { provider: "linkedin" } }).then(
                (res) => {
                  toast.message(`LinkedIn: ${res.status}`);
                  void qc.invalidateQueries({ queryKey: ["integrations"] });
                },
                (err: unknown) =>
                  toast.error(err instanceof Error ? err.message : "Verifieringen misslyckades."),
              )
            }
          >
            <PlugZap aria-hidden="true" />
            Verifiera anslutning
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/studio/integrations">Alla integrationer</Link>
          </Button>
        </div>
        {linkedin?.notes ? <p className="text-xs text-muted-foreground">{linkedin.notes}</p> : null}
      </section>

      <section aria-label="Säkerhet" className="surface-glass space-y-3 rounded-xl p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Säkerhet och sekretess
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Alla studiosidor kräver inloggning och godkänd teambehörighet.</li>
          <li>
            Studions tabeller är stängda för webbläsaren — all läsning sker via serverfunktioner.
          </li>
          <li>
            Media ligger i en privat lagringsplats; förhandsvisning och nedladdning sker via
            tidsbegränsade länkar.
          </li>
          <li>
            Kundmaterial, leveranser och publiceringsförsök loggas med användare, tid och version.
          </li>
          <li>Inga nycklar eller tokens finns i webbläsarkod.</li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Reglerna som styr innehåll och QA finns under{" "}
          <Link to="/studio/qa" className="underline">
            Skills &amp; QA
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
