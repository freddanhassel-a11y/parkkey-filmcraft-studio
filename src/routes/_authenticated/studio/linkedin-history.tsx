import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  Archive,
  BarChart3,
  CheckCircle2,
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
      { title: "LinkedIn History — ParkKey™ Film Studio" },
      {
        name: "description",
        content:
          "Verifierad LinkedIn-historik, asset-matchning, analytics och synkspår för ParkKey Film Studio.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LinkedInHistoryPage,
});

function fmtDate(value?: string | null) {
  if (!value) return "Ej verifierat";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Ej verifierat";
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
  return Number.isFinite(n) ? new Intl.NumberFormat("sv-SE").format(n) : "—";
}

function LinkedInHistoryPage() {
  const load = useServerFn(getLinkedInHistoryDashboard);
  const query = useQuery({ queryKey: ["linkedin-history-dashboard"], queryFn: () => load() });
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const rows = query.data?.posts ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row: any) =>
      [row.title, row.campaign, row.copy_sv, row.linkedin_author_name, row.sync_source]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query.data?.posts, search]);

  const verified = filtered.filter((row: any) => row.linkedin_post_id || row.sync_confidence === "VERIFIED");
  const assets = filtered.filter((row: any) => !row.linkedin_post_id && row.sync_confidence === "ASSET_ONLY");
  const summary = query.data?.summary;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="LinkedIn intelligence"
        title="LinkedIn History & Analytics"
        description="En sanningsenlig källa för publicerad historik, ParkKey-material som ännu inte kunnat matchas till en LinkedIn-post, verifierade veckodata och synkspår. Saknad data visas som saknad — aldrig som noll."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={Linkedin} label="Historikrader" value={metric(summary?.totalRows)} note="Alla LinkedIn-relaterade poster" />
        <MetricCard icon={ShieldCheck} label="Verifierade poster" value={metric(summary?.verifiedPosts)} note="Post-ID/LinkedIn-verifiering" />
        <MetricCard icon={Archive} label="Asset-only" value={metric(summary?.assetOnlyRows)} note="Material ännu ej matchat till post" />
        <MetricCard icon={BarChart3} label="Verifierade visningar" value={metric(summary?.verifiedWeeklyImpressions)} note={`${metric(summary?.weeklyPeriods)} veckoperioder`} />
        <MetricCard icon={RefreshCw} label="Senaste synk" value={summary?.latestSync?.status ?? "Ingen API-synk"} note={fmtDate(summary?.latestSync?.started_at)} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/70 p-4 backdrop-blur-xl">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Sök titel, kampanj, källa eller text…" className="pl-9" />
        </div>
        <Button asChild variant="outline">
          <Link to="/studio/linkedin">Skapa & publicera</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/studio/media">Öppna mediabibliotek</Link>
        </Button>
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Läser LinkedIn-historik…</p>
      ) : query.isError ? (
        <div className="rounded-xl border border-status-error/40 bg-card/70 p-5 text-sm text-status-error">
          Historiken kunde inte läsas. Databasmigrationerna kan ännu vara ej applicerade i live-miljön.
        </div>
      ) : (
        <Tabs defaultValue="verified" className="space-y-5">
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="verified">Verifierade ({verified.length})</TabsTrigger>
            <TabsTrigger value="assets">Asset-historik ({assets.length})</TabsTrigger>
            <TabsTrigger value="analytics">Veckoanalys ({query.data?.weekly.length ?? 0})</TabsTrigger>
            <TabsTrigger value="sync">Synklogg ({query.data?.runs.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="verified" className="space-y-3">
            {verified.length === 0 ? <Empty text="Inga verifierade LinkedIn-poster har ännu kunnat läsas in." /> : verified.map((row: any) => <PostCard key={row.id} row={row} verified />)}
          </TabsContent>

          <TabsContent value="assets" className="space-y-3">
            <div className="rounded-xl border border-status-unknown/35 bg-card/60 p-4 text-sm text-muted-foreground">
              Dessa rader är verkligt ParkKey-material men saknar verifierat LinkedIn-post-ID eller permalink. De hålls separerade tills en säker matchning finns.
            </div>
            {assets.length === 0 ? <Empty text="Ingen omatchad asset-historik." /> : assets.map((row: any) => <PostCard key={row.id} row={row} />)}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-3">
            {(query.data?.weekly ?? []).map((row: any) => (
              <div key={row.id} className="grid gap-4 rounded-xl border border-border bg-card/70 p-5 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-sm font-semibold">{row.week_start} → {row.week_end}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Källa: {row.source} · verifierad veckosummering, inte fördelad per post.</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold tracking-tight">{metric(row.impressions)}</p>
                  <p className="text-xs text-muted-foreground">visningar</p>
                </div>
              </div>
            ))}
            {(query.data?.weekly ?? []).length === 0 ? <Empty text="Ingen verifierad veckoanalys ännu." /> : null}
          </TabsContent>

          <TabsContent value="sync" className="space-y-3">
            {(query.data?.runs ?? []).map((run: any) => (
              <div key={run.id} className="rounded-xl border border-border bg-card/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{run.source}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(run.started_at)} · konto: {run.account_name ?? run.account_id ?? "ej angivet"}</p>
                  </div>
                  <StatusBadge status={run.status} />
                </div>
                <div className="mt-4 grid gap-3 text-xs sm:grid-cols-4">
                  <Mini label="Sedda" value={run.posts_seen} />
                  <Mini label="Nya" value={run.posts_inserted} />
                  <Mini label="Uppdaterade" value={run.posts_updated} />
                  <Mini label="Warnings" value={run.warnings} />
                </div>
                {run.error_message ? <p className="mt-3 text-xs text-status-error">{run.error_message}</p> : null}
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
  return (
    <div className="rounded-xl border border-border bg-card/70 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon className="size-4" aria-hidden="true" />{label}</div>
      <p className="mt-3 break-words text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-lg border border-border/70 p-3"><p className="text-muted-foreground">{label}</p><p className="mt-1 text-base font-semibold">{metric(value)}</p></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function PostCard({ row, verified = false }: { row: any; verified?: boolean }) {
  const reactions = row.reactions ?? row.linkedin_metrics?.reactions;
  const comments = row.comments ?? row.linkedin_metrics?.comments;
  const reposts = row.reposts ?? row.linkedin_metrics?.reposts;
  const impressions = row.impressions ?? row.linkedin_metrics?.impressions;
  return (
    <article className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {verified ? <CheckCircle2 className="size-4 text-status-verified" aria-hidden="true" /> : <Archive className="size-4 text-status-unknown" aria-hidden="true" />}
            <h2 className="font-semibold">{row.title}</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{verified ? `Publicerad: ${fmtDate(row.verified_published_at ?? row.published_at)}` : `Assetdatum: ${fmtDate(row.asset_date)}`} · källa: {row.sync_source ?? "okänd"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2"><TruthBadge label={row.truth_label ?? (verified ? "VERIFIED LINKEDIN" : "VERIFIED ASSET")} /><StatusBadge status={row.status ?? "REVIEW"} /></div>
      </div>
      {row.copy_sv ? <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{row.copy_sv}</p> : null}
      {verified ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <Mini label="Visningar" value={impressions} />
          <Mini label="Reaktioner" value={reactions} />
          <Mini label="Kommentarer" value={comments} />
          <Mini label="Reposts" value={reposts} />
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {row.linkedin_post_id ? <span>Post-ID: {row.linkedin_post_id}</span> : <span>Post-ID: ej verifierat</span>}
        <span>Metrics: {row.metrics_status ?? "UNVERIFIED"}</span>
        {row.post_url ? <a href={row.post_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Öppna på LinkedIn <ExternalLink className="size-3" /></a> : null}
      </div>
    </article>
  );
}
