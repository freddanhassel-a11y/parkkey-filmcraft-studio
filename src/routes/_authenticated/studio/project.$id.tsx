import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Download, RefreshCw, Star } from "lucide-react";
import {
  duplicateVersion,
  getProject,
  regeneratePrompts,
  listIntegrations,
  registerRender,
  saveQa,
  updateProject,
} from "@/lib/studio.functions";
import { PROJECT_STATUSES } from "@/lib/parkkey-rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/studio/brand";
import { StatusBadge, TruthBadge } from "@/components/studio/StatusBadge";
import { PromptDocCard } from "@/components/studio/PromptDocCard";
import { StoryboardReference } from "@/components/studio/StoryboardReference";
import { STORYBOARD_TAG } from "@/lib/storyboard-reference";

export const Route = createFileRoute("/_authenticated/studio/project/$id")({
  component: ProjectPage,
});

type QaItem = { id: string; label: string; source: string; checked: boolean; note?: string };

function ProjectPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchProject = useServerFn(getProject);
  const doRegenerate = useServerFn(regeneratePrompts);
  const doDuplicate = useServerFn(duplicateVersion);
  const doUpdate = useServerFn(updateProject);
  const doSaveQa = useServerFn(saveQa);
  const doRegisterRender = useServerFn(registerRender);
  const fetchIntegrations = useServerFn(listIntegrations);

  const { data: integrations } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchIntegrations({}),
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject({ data: { id } }),
  });

  const [versionId, setVersionId] = useState<string | null>(null);
  const [qaItems, setQaItems] = useState<QaItem[]>([]);
  const [fileUrl, setFileUrl] = useState("");

  const versions = data?.versions ?? [];
  const activeVersionId = versionId ?? versions[versions.length - 1]?.id ?? null;

  const qa = (data?.qa ?? []).find((q) => q.version_id === activeVersionId);
  const render = (data?.renders ?? []).find((r) => r.version_id === activeVersionId);
  const prompts = (data?.prompts ?? []).filter((p) => p.version_id === activeVersionId);

  useEffect(() => {
    if (qa) setQaItems((qa.items as unknown as QaItem[]) ?? []);
  }, [qa?.id, qa?.updated_at]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["project", id] });

  const regen = useMutation({
    mutationFn: () =>
      doRegenerate({ data: { projectId: id, versionId: activeVersionId as string } }),
    onSuccess: () => {
      toast.success("Produktionspaketet regenererat.");
      void invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Misslyckades."),
  });

  const dupe = useMutation({
    mutationFn: () =>
      doDuplicate({ data: { projectId: id, versionId: activeVersionId as string } }),
    onSuccess: (res) => {
      toast.success(`${res.label} skapad.`);
      setVersionId(res.versionId);
      void invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Misslyckades."),
  });

  const setStatus = useMutation({
    mutationFn: (status: string) => doUpdate({ data: { id, patch: { status } } }),
    onSuccess: () => {
      toast.success("Status uppdaterad.");
      void invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Misslyckades."),
  });

  const toggleFavorite = useMutation({
    mutationFn: (value: boolean) => doUpdate({ data: { id, patch: { is_favorite: value } } }),
    onSuccess: () => void invalidate(),
  });

  const persistQa = useMutation({
    mutationFn: (items: QaItem[]) => doSaveQa({ data: { qaId: qa?.id as string, items } }),
    onSuccess: (res) => {
      toast.success(res.passed ? "QA-grind godkänd." : "QA sparad — punkter kvarstår.");
      void invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Misslyckades."),
  });

  const linkRender = useMutation({
    mutationFn: () =>
      doRegisterRender({ data: { renderId: render?.id as string, file_url: fileUrl } }),
    onSuccess: () => {
      toast.success("MP4 registrerad — nedladdning aktiverad.");
      setFileUrl("");
      void invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Misslyckades."),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !data?.project) {
    return (
      <div className="surface-glass rounded-xl p-6">
        <h2 className="font-semibold text-foreground">Projektet kunde inte hämtas</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isError && error instanceof Error ? error.message : "Projektet finns inte."}
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => void refetch()}>Försök igen</Button>
          <Button asChild variant="secondary">
            <Link to="/studio/library">Till biblioteket</Link>
          </Button>
        </div>
      </div>
    );
  }

  const p = data.project;
  const qaPassed = qaItems.length > 0 && qaItems.every((i) => i.checked);

  return (
    <div className="space-y-10">
      <section className="surface-glass rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={p.status} />
          <TruthBadge label={p.truth_label} />
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">{p.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {p.campaign ?? "Ingen kampanj angiven"} · {p.duration_seconds}s · {p.aspect_ratio} ·{" "}
          {p.resolution} · {p.fps} fps · H.264 MP4
        </p>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["Mål", p.goal],
              ["Målgrupp", p.audience],
              ["Kanal", p.channel],
              ["CTA", p.cta],
              ["Visuell mood", p.visual_mood],
              ["Plats och tid", p.location_time],
              ["Parky-användning", p.parky_usage],
              ["Enhetsinteraktion", p.device_interaction],
              ["Musikriktning", p.music_direction],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-[0.14em] text-primary">{label}</dt>
              <dd className="mt-1 text-muted-foreground">{value || "Ej angivet"}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-xs text-muted-foreground">
          Ljud: voiceover {p.voice_enabled ? "PÅ" : "AV"} · undertexter{" "}
          {p.subtitles_enabled ? "PÅ" : "AV"} · SFX {p.sfx_enabled ? "PÅ" : "AV"}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground"
              value={p.status}
              onChange={(e) => setStatus.mutate(e.target.value)}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={() => toggleFavorite.mutate(!p.is_favorite)}
            aria-pressed={p.is_favorite}
          >
            <Star aria-hidden="true" className={p.is_favorite ? "text-gold" : ""} />
            {p.is_favorite ? "Favorit" : "Markera som favorit"}
          </Button>
        </div>
      </section>

      {p.tags.includes(STORYBOARD_TAG) ? <StoryboardReference posterUrl={p.poster_url} /> : null}

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Versionering"
          title="Versioner och changelog"
          description="Duplicera för att skapa nästa version med samma produktionspaket som utgångspunkt."
        >
          <Button variant="secondary" onClick={() => dupe.mutate()} disabled={dupe.isPending}>
            <Copy aria-hidden="true" />
            Duplicera version
          </Button>
        </SectionHeading>
        <ul className="flex flex-wrap gap-2">
          {versions.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => setVersionId(v.id)}
                aria-pressed={v.id === activeVersionId}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  v.id === activeVersionId
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {v.version_label}
              </button>
            </li>
          ))}
        </ul>
        <div className="surface-glass rounded-xl p-4 text-sm text-muted-foreground">
          {versions.find((v) => v.id === activeVersionId)?.changelog ?? "Ingen changelog."}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Prompt Engine"
          title="Produktionspaket"
          description="Masterprompt, storyboard, shot list, kontinuitetsbibel, musikbrief, negativlista och export/QA-spec."
        >
          <Button variant="secondary" onClick={() => regen.mutate()} disabled={regen.isPending}>
            <RefreshCw aria-hidden="true" />
            {regen.isPending ? "Genererar…" : "Regenerera"}
          </Button>
        </SectionHeading>
        {prompts.length === 0 ? (
          <p className="surface-glass rounded-xl p-6 text-sm text-muted-foreground">
            Inga prompts på den här versionen ännu — tryck Regenerera.
          </p>
        ) : (
          <ul className="space-y-4">
            {prompts.map((doc) => (
              <li key={doc.id}>
                <PromptDocCard
                  title={doc.title}
                  content={doc.content}
                  filenameBase={`${p.title}-${doc.kind}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="QA-grind"
          title="Kontroll före export"
          description="Alla punkter måste vara verifierade innan export godkänns."
        />
        {!qa ? (
          <p className="surface-glass rounded-xl p-6 text-sm text-muted-foreground">
            Ingen QA-checklista på den här versionen.
          </p>
        ) : (
          <div className="surface-glass space-y-4 rounded-xl p-5">
            <ul className="space-y-3">
              {qaItems.map((item, index) => (
                <li key={item.id} className="flex items-start gap-3">
                  <Checkbox
                    id={`qa-${item.id}`}
                    checked={item.checked}
                    onCheckedChange={(v) =>
                      setQaItems((items) =>
                        items.map((it, i) => (i === index ? { ...it, checked: v === true } : it)),
                      )
                    }
                  />
                  <Label htmlFor={`qa-${item.id}`} className="text-sm leading-relaxed">
                    {item.label}
                  </Label>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => persistQa.mutate(qaItems)} disabled={persistQa.isPending}>
                Spara QA
              </Button>
              <span className="text-xs text-muted-foreground">
                {qaPassed
                  ? "Alla punkter verifierade."
                  : `${qaItems.filter((i) => !i.checked).length} punkter kvar att verifiera.`}
              </span>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Export"
          title="Renderad fil"
          description="Nedladdning finns bara när en verklig MP4 är registrerad på versionen."
        />
        <div className="surface-glass space-y-4 rounded-xl p-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={render?.status ?? "NO FILE"} />
            <span className="text-sm text-muted-foreground">
              Leverantör: {render?.provider ?? "manual-upload"}
            </span>
          </div>

          {(() => {
            const renderProviders = (integrations ?? []).filter(
              (i) => i.provider !== "manual-upload",
            );
            const connected = renderProviders.filter((i) => i.status === "CONNECTED");
            if (connected.length > 0) return null;
            return (
              <div className="rounded-lg border border-warning/40 bg-warning/5 p-4">
                <p className="text-sm font-semibold text-warning">
                  Ingen automatisk render-provider är ansluten — ingen rendering kan startas
                  härifrån.
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {renderProviders.map((i) => (
                    <li key={i.id}>
                      {i.display_name} — {i.status}
                      {i.capability ? ` · ${i.capability}` : ""}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  Promptpaketet är export-ready: kopiera eller ladda ner masterprompt, storyboard,
                  shot list, kontinuitetsbibel, musikbrief, negativlista och export/QA-spec och kör
                  render externt. Registrera sedan MP4-adressen nedan.
                </p>
              </div>
            );
          })()}

          {render?.status === "READY" && render.file_url ? (
            <div className="space-y-2">
              <Button asChild>
                <a href={render.file_url} download target="_blank" rel="noreferrer">
                  <Download aria-hidden="true" />
                  Ladda ner MP4-master
                </a>
              </Button>
              <p className="text-xs text-muted-foreground">
                {render.width}×{render.height} · {render.fps} fps · {render.codec ?? "H.264"}
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium text-warning">
              Ingen renderad fil ännu. Registrera MP4-filens adress nedan när filmen är renderad.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="render-url">MP4-adress (https)</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="render-url"
                className="max-w-md"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://…/parky-testet-master.mp4"
              />
              <Button
                variant="secondary"
                onClick={() => linkRender.mutate()}
                disabled={!fileUrl.trim() || !render || linkRender.isPending}
              >
                Registrera fil
              </Button>
            </div>
            {!qaPassed ? (
              <p className="text-xs text-muted-foreground">
                QA-grinden är inte helt verifierad — markera exporten som godkänd först när alla
                punkter är gröna.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
