import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus,
  Star,
  Sparkles,
  Film,
  Download,
  ShieldCheck,
  ExternalLink,
  GitBranch,
  Database,
  Blocks,
} from "lucide-react";
import { getDashboard } from "@/lib/studio.functions";
import { getProductionReadiness } from "@/lib/production-readiness.functions";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/studio/brand";
import { StatusBadge, TruthBadge } from "@/components/studio/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/studio/")({
  component: Dashboard,
});

const PRODUCTION_STUDIO_URL =
  "https://parkkey-filmcraft-studio.parkkey-coreos-nordic-2026.workers.dev/studio";
const LOVABLE_EDITOR_URL = "https://lovable.dev/projects/478216cd-8762-46d9-b834-88a0dfe94246";

function Dashboard() {
  const fetchDashboard = useServerFn(getDashboard);
  const fetchReadiness = useServerFn(getProductionReadiness);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
  });
  const readiness = useQuery({
    queryKey: ["production-readiness"],
    queryFn: () => fetchReadiness(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="surface-glass rounded-xl p-6">
        <h2 className="font-semibold text-foreground">Kunde inte hämta studiodata</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Okänt fel."}
        </p>
        <Button className="mt-4" onClick={() => void refetch()}>
          Försök igen
        </Button>
      </div>
    );
  }

  const projects = data?.projects ?? [];
  const inProgress = projects.filter((p) => p.status !== "EXPORTED" && p.status !== "APPROVED");
  const favorites = projects.filter((p) => p.is_favorite);
  const readyRenders = (data?.renders ?? []).filter((r) => r.status === "READY");
  const buildSha = import.meta.env.VITE_FILM_STUDIO_SHA?.trim();
  const buildVerified = Boolean(buildSha);

  return (
    <div className="space-y-10">
      <section className="surface-glass glow-park rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              ParkKey™ Film Studio
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
              Skapa nästa ParkKey-film
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Brief in, komplett produktionspaket ut: masterprompt, storyboard, shot list,
              kontinuitetsbibel, musikbrief, negativlista och export/QA-spec.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link to="/studio/new">
              <Plus aria-hidden="true" />
              Skapa ny film
            </Link>
          </Button>
        </div>
      </section>

      <section className="space-y-4" aria-label="Studio bridge">
        <SectionHeading
          eyebrow="Studio Bridge"
          title="Lovable och liveversionen arbetar mot samma sanning"
          description="GitHub main är kodens source of truth, Cloudflare kör produktion, Lovable används för design/admin och Supabase/CoreOS bär den delade datan."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="surface-glass rounded-xl p-4">
            <div className="flex items-center justify-between gap-2">
              <GitBranch aria-hidden="true" className="size-4 text-primary" />
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  buildVerified
                    ? "bg-primary/15 text-primary"
                    : "bg-status-warning/15 text-status-warning"
                }`}
              >
                {buildVerified ? "VERIFIED BUILD" : "UNVERIFIED BUILD"}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">GitHub main</h3>
            <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
              {buildSha ?? "Ingen build-SHA injicerad i denna körning"}
            </p>
          </div>

          <div className="surface-glass rounded-xl p-4">
            <ExternalLink aria-hidden="true" className="size-4 text-primary" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">Cloudflare · LIVE</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Canonical operativ Studio. Verkliga auth-, media-, render- och publiceringsflöden körs här.
            </p>
            <Button asChild size="sm" variant="secondary" className="mt-3">
              <a href={PRODUCTION_STUDIO_URL} target="_blank" rel="noreferrer">
                Öppna live Studio
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
          </div>

          <div className="surface-glass rounded-xl p-4">
            <Blocks aria-hidden="true" className="size-4 text-primary" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">Lovable · DESIGN / ADMIN</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Visuell iteration, connector-setup och adminhjälp. En Lovable-preview är aldrig automatiskt produktion.
            </p>
            <Button asChild size="sm" variant="secondary" className="mt-3">
              <a href={LOVABLE_EDITOR_URL} target="_blank" rel="noreferrer">
                Öppna Lovable
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
          </div>

          <div className="surface-glass rounded-xl p-4">
            <Database aria-hidden="true" className="size-4 text-primary" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">Supabase + CoreOS · SHARED DATA</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Samma auth, studio-data, media, kampanjer, approvals, integration truth-state och auditspår används av flödet.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Filmprojekt" value={projects.length} icon={Film} />
        <StatCard label="Pågående" value={inProgress.length} icon={Sparkles} />
        <StatCard label="Favoriter" value={favorites.length} icon={Star} />
        <StatCard label="Renderade filer" value={readyRenders.length} icon={Download} />
      </section>

      <section className="space-y-4" aria-label="Production readiness">
        <SectionHeading
          eyebrow="Production readiness"
          title="Vad är faktiskt anslutet?"
          description="Status visas bara som CONNECTED när en verklig kontroll kan styrka anslutningen. Okända lägen blir aldrig gröna."
        >
          <Button asChild variant="secondary">
            <Link to="/studio/integrations">Integrationer</Link>
          </Button>
        </SectionHeading>
        {readiness.isLoading ? (
          <div className="grid gap-3 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : readiness.isError ? (
          <div className="surface-glass rounded-xl border border-status-error/30 p-4 text-sm text-status-error">
            Readiness-kontrollen kunde inte slutföras. Ingen anslutning antas vara aktiv.
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {(readiness.data?.items ?? []).map((item) => (
              <li key={item.key} className="surface-glass rounded-xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
                  <StatusBadge status={item.state} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{item.label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.note}</p>
                {item.verifiedAt ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Verifierad: {new Date(item.verifiedAt).toLocaleString("sv-SE")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Senaste"
          title="Filmer och pågående projekt"
          description="Sorterat på senast uppdaterad. Statusen speglar verkligt läge — ingen påhittad progress."
        >
          <Button asChild variant="secondary">
            <Link to="/studio/library">Hela biblioteket</Link>
          </Button>
        </SectionHeading>

        {projects.length === 0 ? (
          <div className="surface-glass rounded-xl p-8 text-center">
            <p className="font-semibold text-foreground">Inga filmprojekt ännu</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Nästa steg: skapa ditt första filmprojekt och generera produktionspaketet.
            </p>
            <Button asChild className="mt-4">
              <Link to="/studio/new">Skapa ny film</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link
                  to="/studio/project/$id"
                  params={{ id: p.id }}
                  className="surface-glass flex h-full flex-col rounded-xl p-5 transition-colors hover:bg-accent/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={p.status} />
                    <TruthBadge label={p.truth_label} />
                    {p.is_favorite ? (
                      <Star aria-label="Favorit" className="size-4 text-gold" />
                    ) : null}
                  </div>
                  <h3 className="mt-3 font-semibold leading-snug text-foreground">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.campaign ?? "Ingen kampanj angiven"}
                  </p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {p.duration_seconds}s · {p.aspect_ratio} · {p.resolution} · {p.fps} fps
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Promptmallar"
          title="Starta från en beprövad mall"
          description="Mallarna följer ParkKeys sanningsregler för respektive målgrupp."
        >
          <Button asChild variant="secondary">
            <Link to="/studio/prompts">Promptbiblioteket</Link>
          </Button>
        </SectionHeading>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.templates ?? []).slice(0, 8).map((t) => (
            <li key={t.id} className="surface-glass rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground">{t.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Export"
          title="Senaste renderingar"
          description="Endast versioner med en verklig MP4-fil kan laddas ner."
        />
        {(data?.renders ?? []).length === 0 ? (
          <p className="surface-glass rounded-xl p-6 text-sm text-muted-foreground">
            Inga renderingar registrerade ännu.
          </p>
        ) : (
          <ul className="space-y-2">
            {(data?.renders ?? []).map((r) => (
              <li
                key={r.id}
                className="surface-glass flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={r.status} />
                  <span className="text-sm text-muted-foreground">{r.provider}</span>
                </div>
                {r.status === "READY" && r.file_url ? (
                  <Button asChild size="sm" variant="secondary">
                    <a href={r.file_url} download target="_blank" rel="noreferrer">
                      <Download aria-hidden="true" />
                      Ladda ner MP4
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">No rendered file yet</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Film;
}) {
  return (
    <div className="surface-glass rounded-xl p-5">
      <Icon aria-hidden="true" className="size-5 text-primary" />
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  );
}
