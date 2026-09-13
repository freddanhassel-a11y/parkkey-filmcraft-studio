import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Star } from "lucide-react";
import { listLibrary } from "@/lib/studio.functions";
import { PROJECT_STATUSES } from "@/lib/parkkey-rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeading } from "@/components/studio/brand";
import { StatusBadge, TruthBadge } from "@/components/studio/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/studio/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const fetchLibrary = useServerFn(listLibrary);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["library"],
    queryFn: () => fetchLibrary(),
  });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [format, setFormat] = useState("");
  const [tag, setTag] = useState("");

  const projects = useMemo(() => data?.projects ?? [], [data?.projects]);
  const renders = data?.renders ?? [];

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        const haystack = `${p.title} ${p.campaign ?? ""} ${p.tags.join(" ")}`.toLowerCase();
        if (q && !haystack.includes(q.toLowerCase())) return false;
        if (status && p.status !== status) return false;
        if (format && p.aspect_ratio !== format) return false;
        if (tag && !p.tags.includes(tag)) return false;
        return true;
      }),
    [projects, q, status, format, tag],
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="surface-glass rounded-xl p-6">
        <h2 className="font-semibold text-foreground">Biblioteket kunde inte hämtas</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Okänt fel."}
        </p>
        <Button className="mt-4" onClick={() => void refetch()}>
          Försök igen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Filmbibliotek"
        title="Alla filmprojekt"
        description="Sök och filtrera på kampanj, format, status och tagg. Nedladdning visas bara när en verklig MP4 finns registrerad."
      >
        <Button asChild>
          <Link to="/studio/new">Skapa ny film</Link>
        </Button>
      </SectionHeading>

      <div className="surface-glass grid gap-4 rounded-xl p-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="search">Sök</Label>
          <Input
            id="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Titel, kampanj eller tagg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-status">Status</Label>
          <select
            id="f-status"
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Alla</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-format">Format</Label>
          <select
            id="f-format"
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="">Alla</option>
            {["16:9", "9:16", "1:1", "4:5"].map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-tag">Tagg</Label>
          <select
            id="f-tag"
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            <option value="">Alla</option>
            {(data?.tags ?? []).map((t) => (
              <option key={t.id} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="surface-glass rounded-xl p-8 text-center text-sm text-muted-foreground">
          Inga filmer matchar filtret.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const ready = renders.find((r) => r.project_id === p.id && r.status === "READY");
            return (
              <li key={p.id} className="surface-glass flex flex-col rounded-xl p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={p.status} />
                  <TruthBadge label={p.truth_label} />
                  {p.is_favorite ? (
                    <Star aria-label="Favorit" className="size-4 text-gold" />
                  ) : null}
                </div>
                {p.poster_url ? (
                  <img
                    src={p.poster_url}
                    alt={`Visuell referens för ${p.title}`}
                    loading="lazy"
                    className="mt-3 aspect-video w-full rounded-lg border border-border object-cover"
                  />
                ) : null}
                <h3 className="mt-3 font-semibold leading-snug text-foreground">{p.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.campaign ?? "Ingen kampanj angiven"}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {p.duration_seconds}s · {p.aspect_ratio} · {p.resolution} · {p.fps} fps
                </p>
                {p.tags.length ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((t: string) => (
                      <li
                        key={t}
                        className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {p.notes ? (
                  <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.notes}</p>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/studio/project/$id" params={{ id: p.id }}>
                      Öppna projekt
                    </Link>
                  </Button>
                  {ready?.file_url ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={ready.file_url} download target="_blank" rel="noreferrer">
                        <Download aria-hidden="true" />
                        MP4
                      </a>
                    </Button>
                  ) : (
                    <span className="self-center text-xs text-muted-foreground">
                      Ingen renderad fil ännu
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
