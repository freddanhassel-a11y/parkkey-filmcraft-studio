import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink, PlugZap, ShieldCheck } from "lucide-react";

import { listIntegrations, verifyIntegration } from "@/lib/integrations.functions";
import { SectionHeading } from "@/components/studio/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/studio/integrations")({
  head: () => ({
    meta: [
      { title: "Integrationer — ParkKey™ Film Studio" },
      {
        name: "description",
        content:
          "Status för render-, bildgenererings- och LinkedIn-anslutningar med verklig verifiering och adminchecklista.",
      },
      { property: "og:title", content: "Integrationer — ParkKey™ Film Studio" },
      {
        property: "og:description",
        content: "Sanningsenlig anslutningsstatus för ParkKey Film Studio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntegrationsPage,
});

const CHECKLIST = [
  "Skapa eller välj ParkKeys LinkedIn-app i LinkedIn Developer-portalen och koppla rätt företagssida när organisationspublicering ska användas.",
  "För publicering som medlem: aktivera Share on LinkedIn och begär w_member_social. För företagssida: använd w_organization_social och verifiera att kontot har rätt sidbehörighet.",
  "Konfigurera OAuth-appen server-side med LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET och LINKEDIN_REDIRECT_URI. Lägg aldrig dessa värden i klientkod.",
  "Slutför LinkedIns member-consent för rätt konto och lagra access token som LINKEDIN_ACCESS_TOKEN i produktionsmiljön — aldrig i GitHub eller webbläsaren.",
  "Kör Verifiera här. CONNECTED får bara visas när både CoreOS-capability och server-side Posts API-transport är verifierade.",
];

function statusTone(status: string) {
  if (status === "CONNECTED") return "text-status-verified border-status-verified/50";
  if (status === "ERROR" || status === "FAILED") return "text-status-error border-status-error/50";
  return "text-status-unknown border-status-unknown/40";
}

function IntegrationsPage() {
  const qc = useQueryClient();
  const fetchIntegrations = useServerFn(listIntegrations);
  const verify = useServerFn(verifyIntegration);
  const { data, isLoading, error } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchIntegrations(),
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Integrationer"
        title="Anslutningar"
        description="Status sätts bara av en verklig kontroll mot serverns miljö. Saknas OAuth, token eller verifierad capability visas det öppet — aldrig grönt för okänt läge."
      />

      <div
        className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4 text-sm"
        role="note"
      >
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 text-primary" />
        <p>
          Alla hemligheter ligger i serverns miljö. Webbläsaren ser aldrig en access token, och all
          publicering och leverans går genom serverfunktioner efter behörighetskontroll.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Hämtar anslutningar…
        </p>
      ) : error ? (
        <p className="text-sm text-status-error">
          Kunde inte hämta anslutningar: {error instanceof Error ? error.message : "okänt fel"}
        </p>
      ) : (
        <ul className="space-y-3">
          {(data?.connections ?? []).map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{c.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.capability ?? "Ingen kapabilitet angiven"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${statusTone(c.status)}`}
                  >
                    {c.status}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void verify({ data: { provider: c.provider } }).then(
                        (res) => {
                          toast.message(`${c.display_name}: ${res.status}`);
                          void qc.invalidateQueries({ queryKey: ["integrations"] });
                        },
                        (err: unknown) =>
                          toast.error(
                            err instanceof Error ? err.message : "Verifieringen misslyckades.",
                          ),
                      )
                    }
                  >
                    <PlugZap aria-hidden="true" />
                    Verifiera
                  </Button>
                </div>
              </div>
              {c.notes ? <p className="mt-3 text-sm text-muted-foreground">{c.notes}</p> : null}
              {c.verified_at ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Senast verifierad {new Date(c.verified_at).toLocaleString("sv-SE")}
                </p>
              ) : null}
            </li>
          ))}
          {(data?.connections ?? []).length === 0 ? (
            <li className="rounded-xl border border-border bg-card/60 p-6 text-sm text-muted-foreground">
              Inga anslutningar registrerade.
            </li>
          ) : null}
        </ul>
      )}

      <section aria-label="Adminchecklista för LinkedIn" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Adminchecklista — LinkedIn OAuth & publicering</h2>
          <Button asChild size="sm" variant="outline">
            <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer">
              LinkedIn Developer
              <ExternalLink aria-hidden="true" />
            </a>
          </Button>
        </div>
        <ol className="space-y-2 rounded-xl border border-border bg-card/60 p-5 text-sm">
          {CHECKLIST.map((item, i) => (
            <li key={item} className="flex gap-3">
              <span className="text-xs font-semibold text-primary">{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">
          Film Studio använder LinkedIn Posts API. Fram till att OAuth och token verkligen är
          verifierade står kön som SCHEDULED — CONNECTION REQUIRED och inget publiceras externt.
        </p>
      </section>
    </div>
  );
}
