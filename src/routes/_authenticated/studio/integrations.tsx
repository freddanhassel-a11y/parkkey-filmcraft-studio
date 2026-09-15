import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarClock, ExternalLink, PlugZap, ShieldCheck } from "lucide-react";

import { listIntegrations, verifyIntegration } from "@/lib/integrations.functions";
import { SectionHeading } from "@/components/studio/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/studio/integrations")({
  head: () => ({
    meta: [
      { title: "Integrationer — ParkKey™ Film Studio" },
      {
        name: "description",
        content: "Gemensam CoreOS/Film Studio-status för verifierad direktanslutning och fungerande fallback-vägar.",
      },
      { name: "robots", content: "noindex,nofollow,noarchive" },
    ],
  }),
  component: IntegrationsPage,
});

const CHECKLIST = [
  "Skapa eller välj ParkKeys LinkedIn-app i LinkedIn Developer-portalen och koppla rätt identitet/sida.",
  "Aktivera rätt write-scope: w_member_social för medlem eller w_organization_social för företagssida.",
  "Konfigurera OAuth server-side. Client secret eller access token får aldrig ligga i klientkod.",
  "När API-token saknas fortsätter Studio använda den fungerande manuella handoffen utan att fejka CONNECTED.",
];

function fmtDate(value?: string | null) {
  if (!value) return "Inte verifierad";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === "CONNECTED") return "text-status-verified border-status-verified/50 bg-status-verified/5";
  if (status === "CONFIGURED") return "text-sky-500 border-sky-500/50 bg-sky-500/5";
  if (status === "ERROR" || status === "FAILED") return "text-status-error border-status-error/50 bg-status-error/5";
  return "text-status-unknown border-status-unknown/40 bg-status-unknown/5";
}

function statusMeaning(status: string) {
  if (status === "CONNECTED") return "Direkt/live anslutning verifierad";
  if (status === "CONFIGURED") return "Fungerande handoff/fallback verifierad";
  return "Ingen verifierad fungerande väg ännu";
}

function IntegrationsPage() {
  const qc = useQueryClient();
  const fetchIntegrations = useServerFn(listIntegrations);
  const verify = useServerFn(verifyIntegration);
  const { data, isLoading, error } = useQuery({ queryKey: ["integrations"], queryFn: () => fetchIntegrations() });

  const connections = data?.connections ?? [];
  const connected = connections.filter((connection) => connection.status === "CONNECTED").length;
  const configured = connections.filter((connection) => connection.status === "CONFIGURED").length;
  const blocked = connections.length - connected - configured;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="CoreOS · Integrationer"
        title="En gemensam anslutningssanning"
        description="CoreOS och Film Studio läser samma integration_connections-register. CONNECTED betyder verifierad direktanslutning. CONFIGURED betyder att en riktig användbar fallback/handoff finns även om leverantörens API-token saknas."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-status-verified/30 bg-card/60 p-4"><p className="text-xs text-muted-foreground">Direkt anslutna</p><p className="mt-1 text-2xl font-semibold text-status-verified">{connected}</p><p className="mt-1 text-[11px] text-muted-foreground">Verifierad live/API/bridge</p></div>
        <div className="rounded-xl border border-sky-500/30 bg-card/60 p-4"><p className="text-xs text-muted-foreground">Fungerande fallback</p><p className="mt-1 text-2xl font-semibold text-sky-500">{configured}</p><p className="mt-1 text-[11px] text-muted-foreground">Kan användas nu utan att fejka API</p></div>
        <div className="rounded-xl border border-status-unknown/30 bg-card/60 p-4"><p className="text-xs text-muted-foreground">Saknar fungerande väg</p><p className="mt-1 text-2xl font-semibold text-status-unknown">{blocked}</p><p className="mt-1 text-[11px] text-muted-foreground">Kräver extern/runtime-åtgärd</p></div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4 text-sm" role="note">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 text-primary" />
        <p>CoreOS är enda inloggningen. Provider-secrets ligger server-side. Verifiera får aldrig nedgradera en fungerande CONFIGURED-handoff enbart för att direkt API-token saknas.</p>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Hämtar anslutningar…</p> : error ? <p className="text-sm text-status-error">Kunde inte hämta anslutningar: {error instanceof Error ? error.message : "okänt fel"}</p> : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {connections.map((connection) => (
            <li key={connection.id} className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur-xl">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1"><p className="font-semibold">{connection.display_name}</p><p className="mt-1 text-xs text-muted-foreground">{connection.capability ?? "Ingen kapabilitet angiven"}</p></div>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${statusTone(connection.status)}`}>{connection.status}</span>
              </div>
              <p className="mt-3 text-xs font-semibold">{statusMeaning(connection.status)}</p>
              {connection.notes ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{connection.notes}</p> : null}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><CalendarClock className="size-3.5" /><span>Verifierad: {fmtDate(connection.verified_at)}</span><span>· Uppdaterad: {fmtDate(connection.updated_at)}</span></div>
                <Button size="sm" variant="outline" onClick={() => void verify({ data: { provider: connection.provider } }).then((res) => { toast.message(`${connection.display_name}: ${res.status}`); void qc.invalidateQueries({ queryKey: ["integrations"] }); }, (err: unknown) => toast.error(err instanceof Error ? err.message : "Verifieringen misslyckades."))}><PlugZap aria-hidden="true" />Verifiera</Button>
              </div>
            </li>
          ))}
          {connections.length === 0 ? <li className="rounded-xl border border-border bg-card/60 p-6 text-sm text-muted-foreground">Inga anslutningar registrerade.</li> : null}
        </ul>
      )}

      <section aria-label="Adminchecklista för LinkedIn" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">LinkedIn — från fungerande handoff till direkt API</h2><Button asChild size="sm" variant="outline"><a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer">LinkedIn Developer<ExternalLink aria-hidden="true" /></a></Button></div>
        <ol className="space-y-2 rounded-xl border border-border bg-card/60 p-5 text-sm">{CHECKLIST.map((item, i) => <li key={item} className="flex gap-3"><span className="text-xs font-semibold text-primary">{i + 1}</span><span>{item}</span></li>)}</ol>
      </section>
    </div>
  );
}
