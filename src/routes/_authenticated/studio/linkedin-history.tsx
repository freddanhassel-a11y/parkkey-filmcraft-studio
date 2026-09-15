/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Archive,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Linkedin,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { SectionHeading } from "@/components/studio/brand";
import { StatusBadge, TruthBadge } from "@/components/studio/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLinkedInHistoryDashboard } from "@/lib/linkedin-history.functions";

export const Route = createFileRoute("/_authenticated/studio/linkedin-history")({
  head: () => ({
    meta: [
      { title: "LinkedIn Pipeline — ParkKey™ Film Studio" },
      {
        name: "description",
        content: "Publicerat, schemalagt, pågående och ej publicerat ParkKey-material med verifierad status och datum.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LinkedInHistoryPage,
});

function fmtDate(value?: string | null) {
  if (!value) return "Datum saknas";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Datum saknas";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function metric(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? new Intl.NumberFormat("sv-SE").format(n) : String(value);
}

const FILTERS = [
  ["all", "Alla"],
  ["PUBLISHED", "Publicerat"],
  ["SCHEDULED", "Schemalagt"],
  ["IN_PROGRESS", "Pågår"],
  ["NOT_PUBLISHED", "Ej publicerat"],
] as const;

function LinkedInHistoryPage() {
  const load = useServerFn(getLinkedInHistoryDashboard);
  const query = useQuery({ queryKey: ["linkedin-history-dashboard"], queryFn: () => load() });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof FILTERS)[number][0]>("all");

  const filtered = useMemo(() => {
    const rows = query.data?.posts ?? [];
    const needle = search.trim().toLowerCase();
    return rows.filter((row: any) => {
      const statusOk = statusFilter === "all" || row.pipeline_status === statusFilter;
      const text = [row.title, row.campaign, row.copy_sv, row.linkedin_author_name, row.sync_source]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return statusOk && (!needle || text.includes(needle));
    });
  }, [query.data?.posts, search, statusFilter]);

  const summary = query.data?.summary;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="LinkedIn intelligence"
        title="LinkedIn · Publiceringspipeline"
        description="En gemensam sanning för vad som verkligen är publicerat, schemalagt, pågår eller ännu inte publicerats. Assetdatum är inte samma sak som publiceringsdatum."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={Linkedin} label="Alla poster" value={metric(summary?.totalRows)} note="ParkKey-relaterad historik" />
        <MetricCard icon={CheckCircle2} label="Publicerat" value={metric(summary?.published)} note="Verifierad post/URL eller PUBLISHED" />
        <MetricCard icon={CalendarClock} label="Schemalagt" value={metric(summary?.scheduled)} note="Har faktiskt scheduled_at" />
        <MetricCard icon={Clock3} label="Pågår" value={metric(summary?.inProgress)} note="Aktiv publish-attempt" />
        <MetricCard icon={Archive} label="Ej publicerat" value={metric(summary?.notPublished)} note="Draft/review/asset-only" />
      </div>

      <div className="rounded-xl border border-status-unknown/35 bg-card/60 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Sanningsregel:</strong> verifierat ParkKey-material kan finnas i Studio utan att vara publicerat på LinkedIn. Asset-only visas därför som <strong>Ej publicerat</strong> tills LinkedIn-post-ID eller permalink kan verifieras.
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/70 p-4 backdrop-blur-xl">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Sök titel, kampanj, källa eller text…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(([value, label]) => (
            <Button key={value} size="sm" variant={statusFilter === value ? "default" : "outline"} onClick={() => setStatusFilter(value)}>
              {label}
            </Button>
          ))}
        </div>
        <Button asChild variant="outline"><Link to="/studio/linkedin">Skapa & publicera</Link></Button>
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Läser LinkedIn-historik…</p>
      ) : query.isError ? (
        <div className="rounded-xl border border-status-error/40 bg-card/70 p-5 text-sm text-status-error">
          Historiken kunde inte läsas: {query.error instanceof Error ? query.error.message : "okänt fel"}
        </div>
      ) : (
        <Tabs defaultValue="pipeline" className="space-y-5">
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="pipeline">Pipeline ({filtered.length})</TabsTrigger>
            <TabsTrigger value="analytics">Veckoanalys ({query.data?.weekly.length ?? 0})</TabsTrigger>
            <TabsTrigger value="sync">Synklogg ({query.data?.runs.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-3">
            {filtered.length === 0 ? <Empty text="Inga poster matchar filtret." /> : filtered.map((row: any) => <PostCard key={row.id} row={row} />)}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-3">
            {(query.data?.weekly ?? []).map((row: any) => (
              <div key={row.id} className="grid gap-4 rounded-xl border border-border bg-card/70 p-5 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-sm font-semibold">{row.period_start} → {row.period_end}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Källa: {row.source} · verifierad veckosummering, inte fördelad per post.</p>
                </div>
                <div className="text-right"><p className="text-2xl font-semibold tracking-tight">{metric(row.impressions)}</p><p className="text-xs text-muted-foreground">visningar</p></div>
              </div>
            ))}
            {(query.data?.weekly ?? []).length === 0 ? <Empty text="Ingen verifierad veckoanalys ännu." /> : null}
          </TabsContent>

          <TabsContent value="sync" className="space-y-3">
            {(query.data?.runs ?? []).map((run: any) => (
              <div key={run.id} className="rounded-xl border border-border bg-card/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{run.source}</p><p className="text-xs text-muted-foreground">{fmtDate(run.started_at)} · konto: {run.account_name ?? run.account_id ?? "ej angivet"}</p></div><StatusBadge status={run.status} /></div>
              </div>
            ))}
            {(query.data?.runs ?? []).length === 0 ? <Empty text="Ingen full LinkedIn Organic API-synk har ännu slutförts." /> : null}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note }: { icon: any; label: string; value: string; note: string }) {
  return <div className="rounded-xl border border-border bg-card/70 p-4 backdrop-blur-xl"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon className="size-4" aria-hidden="true" />{label}</div><p className="mt-3 break-words text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function statusLabel(status: string) {
  if (status === "PUBLISHED") return "PUBLICERAT";
  if (status === "SCHEDULED") return "SCHEMALAGT";
  if (status === "IN_PROGRESS") return "PÅGÅR";
  return "EJ PUBLICERAT";
}

function PostCard({ row }: { row: any }) {
  const publicUrl = row.public_url ?? row.linkedin_permalink ?? row.source_post_url;
  const dateLabel = row.pipeline_status === "PUBLISHED" ? "Publiceringsdatum" : row.pipeline_status === "SCHEDULED" ? "Schemalagt" : row.sync_confidence === "ASSET_ONLY" ? "Assetdatum" : "Datum";
  return (
    <article className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {row.pipeline_status === "PUBLISHED" ? <CheckCircle2 className="size-4 text-status-verified" aria-hidden="true" /> : row.pipeline_status === "SCHEDULED" ? <CalendarClock className="size-4 text-sky-500" aria-hidden="true" /> : row.pipeline_status === "IN_PROGRESS" ? <Clock3 className="size-4 text-warning" aria-hidden="true" /> : <Archive className="size-4 text-status-unknown" aria-hidden="true" />}
            <h2 className="font-semibold">{row.title}</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{dateLabel}: {fmtDate(row.display_date)} · källa: {row.sync_source ?? "Studio"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2"><TruthBadge label={row.truth_label ?? "UNVERIFIED"} /><StatusBadge status={statusLabel(row.pipeline_status)} /></div>
      </div>
      {row.copy_sv ? <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{row.copy_sv}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Sync: {row.sync_confidence ?? "UNVERIFIED"}</span>
        <span>Post-ID: {row.linkedin_post_id ?? "ej verifierat"}</span>
        {row.schedule_status ? <span>Schema: {row.schedule_status}</span> : null}
        {row.publish_attempt_status ? <span>Publish attempt: {row.publish_attempt_status}</span> : null}
        {publicUrl ? <a href={publicUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Öppna publicering <ExternalLink className="size-3" /></a> : null}
      </div>
    </article>
  );
}
