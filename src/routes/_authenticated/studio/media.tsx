import { useCallback, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Archive,
  CalendarDays,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FileVideo,
  ImageIcon,
  Music,
  Play,
  Upload,
  UploadCloud,
} from "lucide-react";

import {
  addMediaVersion,
  archiveMediaAsset,
  createUploadTarget,
  getMediaLink,
  listMedia,
  MEDIA_APPROVAL,
  MEDIA_CATEGORIES,
  registerMediaAsset,
  updateMediaAsset,
} from "@/lib/media.functions";
import { formatBytes, formatDuration, probeMedia, uploadToSignedUrl } from "@/lib/upload";
import { SectionHeading } from "@/components/studio/brand";
import { TruthBadge } from "@/components/studio/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/studio/media")({
  head: () => ({
    meta: [
      { title: "Mediabibliotek — ParkKey™ Film Studio" },
      {
        name: "description",
        content:
          "Privat ParkKey-mediabibliotek för bilder, video och ljud med thumbnails, datum, versioner och verifierad status.",
      },
      { property: "og:title", content: "Mediabibliotek — ParkKey™ Film Studio" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MediaPage,
});

type UploadRow = { id: string; name: string; percent: number; error: string | null; done: boolean };
type MediaAsset = NonNullable<Awaited<ReturnType<typeof listMedia>>["assets"]>[number] & {
  preview_url?: string | null;
  external_source_url?: string | null;
  source_created_at?: string | null;
  source_platform?: string | null;
  brand_review_status?: string | null;
};

function KindIcon({ kind, className = "size-4" }: { kind: string; className?: string }) {
  if (kind === "video") return <FileVideo aria-hidden="true" className={className} />;
  if (kind === "audio") return <Music aria-hidden="true" className={className} />;
  if (kind === "document") return <FileText aria-hidden="true" className={className} />;
  return <ImageIcon aria-hidden="true" className={className} />;
}

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

function MediaThumbnail({ asset }: { asset: MediaAsset }) {
  const realPreview = asset.preview_url;
  if (asset.kind === "image" && realPreview) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl border border-border bg-black/5">
        <img src={realPreview} alt={asset.name} className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }
  if (asset.kind === "video" && realPreview) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
        <video src={realPreview} muted preload="metadata" playsInline className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/15">
          <span className="rounded-full border border-white/30 bg-black/50 p-3 text-white backdrop-blur">
            <Play className="size-5 fill-current" aria-hidden="true" />
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-primary/20 bg-[radial-gradient(circle_at_20%_10%,rgba(124,255,159,0.20),transparent_34%),linear-gradient(135deg,#071827,#0d3a3a_58%,#071827)] p-5 text-white">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
            {asset.kind}
          </span>
          <KindIcon kind={asset.kind} className="size-5 text-primary" />
        </div>
        <div>
          <p className="line-clamp-2 text-lg font-semibold leading-tight">{asset.name}</p>
          <p className="mt-2 text-[11px] text-white/70">
            {asset.source_platform ?? asset.category ?? "ParkKey Studio"} · {fmtDate(asset.source_created_at ?? asset.created_at)}
          </p>
        </div>
      </div>
      <span className="absolute bottom-3 right-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45">
        Preview saknas
      </span>
    </div>
  );
}

function MediaPage() {
  const qc = useQueryClient();
  const fetchMedia = useServerFn(listMedia);
  const target = useServerFn(createUploadTarget);
  const register = useServerFn(registerMediaAsset);
  const addVersion = useServerFn(addMediaVersion);
  const link = useServerFn(getMediaLink);
  const update = useServerFn(updateMediaAsset);
  const archive = useServerFn(archiveMediaAsset);

  const { data, isLoading, error } = useQuery({ queryKey: ["media"], queryFn: () => fetchMedia() });
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const [category, setCategory] = useState<string>("Brand asset");
  const [projectId, setProjectId] = useState<string>("none");
  const [usageRights, setUsageRights] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<{ name: string; url: string; kind: string } | null>(null);
  const [versionFor, setVersionFor] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const versionInput = useRef<HTMLInputElement>(null);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["media"] });

  const handleFiles = useCallback(
    async (files: FileList | null, asVersionOf?: string | null) => {
      if (!files || files.length === 0) return;
      for (const file of Array.from(files)) {
        const rowId = crypto.randomUUID();
        setUploads((prev) => [...prev, { id: rowId, name: file.name, percent: 0, error: null, done: false }]);
        try {
          const probe = await probeMedia(file);
          const t = await target({ data: { fileName: file.name, mimeType: file.type, size: file.size } });
          await uploadToSignedUrl(t.signedUrl, file, (percent) =>
            setUploads((prev) => prev.map((u) => (u.id === rowId ? { ...u, percent } : u))),
          );
          if (asVersionOf) {
            await addVersion({
              data: {
                asset_id: asVersionOf,
                storage_path: t.path,
                mime_type: file.type,
                file_size: file.size,
                width: probe.width,
                height: probe.height,
                duration_seconds: probe.duration_seconds,
                changelog: `Ny version: ${file.name}`,
              },
            });
          } else {
            await register({
              data: {
                name: file.name.replace(/\.[^.]+$/, ""),
                storage_path: t.path,
                mime_type: file.type,
                file_size: file.size,
                width: probe.width,
                height: probe.height,
                duration_seconds: probe.duration_seconds,
                category,
                usage_rights: usageRights || null,
                film_project_id: projectId === "none" ? null : projectId,
              },
            });
          }
          setUploads((prev) => prev.map((u) => (u.id === rowId ? { ...u, percent: 100, done: true } : u)));
          invalidate();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Uppladdningen misslyckades.";
          setUploads((prev) => prev.map((u) => (u.id === rowId ? { ...u, error: message } : u)));
          toast.error(message);
        }
      }
      setVersionFor(null);
    },
    [addVersion, category, projectId, register, target, usageRights],
  );

  const openLink = useMutation({
    mutationFn: (vars: { path: string; download: boolean; name: string; kind: string }) =>
      link({ data: { path: vars.path, download: vars.download } }),
    onSuccess: (res, vars) => {
      if (vars.download) window.location.href = res.url;
      else setPreview({ name: vars.name, url: res.url, kind: vars.kind });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Kunde inte skapa länk."),
  });

  const assets = useMemo(() => {
    const list = (data?.assets ?? []) as MediaAsset[];
    return list.filter((a) => {
      const kindOk = kindFilter === "all" || a.kind === kindFilter;
      const term = search.trim().toLowerCase();
      const textOk = !term || a.name.toLowerCase().includes(term) || (a.category ?? "").toLowerCase().includes(term) || (a.tags ?? []).some((t: string) => t.toLowerCase().includes(term));
      return kindOk && textOk;
    });
  }, [data, kindFilter, search]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Media"
        title="Mediabibliotek"
        description="Alla Studio-media visas med thumbnail, sanningsstatus och datum. Riktig preview används när filen är åtkomlig; metadata-only historik får en tydligt märkt ParkKey-thumbnail och låtsas aldrig vara originalbilden."
      />

      <section
        aria-label="Ladda upp material"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFiles(e.dataTransfer.files); }}
        className={`rounded-2xl border-2 border-dashed p-6 transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border bg-card/60"}`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <p className="flex items-center gap-2 text-sm font-semibold"><UploadCloud aria-hidden="true" className="size-4 text-primary" />Dra och släpp bilder eller video här</p>
            <p className="mt-1 text-xs text-muted-foreground">Bild/ljud upp till 25 MB, video upp till 512 MB.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="cat">Klassificering</Label><Select value={category} onValueChange={setCategory}><SelectTrigger id="cat"><SelectValue /></SelectTrigger><SelectContent>{MEDIA_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="proj">Kopplad film</Label><Select value={projectId} onValueChange={setProjectId}><SelectTrigger id="proj"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Ingen</SelectItem>{(data?.projects ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="rights">Rättigheter/källa</Label><Input id="rights" value={usageRights} onChange={(e) => setUsageRights(e.target.value)} placeholder="t.ex. Egen produktion" /></div>
          </div>
          <Button onClick={() => fileInput.current?.click()}><Upload aria-hidden="true" />Välj filer</Button>
          <input ref={fileInput} type="file" multiple className="sr-only" aria-label="Välj filer att ladda upp" onChange={(e) => void handleFiles(e.target.files)} />
          <input ref={versionInput} type="file" className="sr-only" aria-label="Välj fil för ny version" onChange={(e) => void handleFiles(e.target.files, versionFor)} />
        </div>
        {uploads.length > 0 ? <ul className="mt-5 space-y-3" aria-live="polite">{uploads.map((u) => <li key={u.id} className="rounded-lg border border-border bg-background/60 p-3"><div className="flex items-center justify-between gap-3 text-sm"><span className="truncate">{u.name}</span><span className={u.error ? "text-status-error" : "text-muted-foreground"}>{u.error ? "Misslyckades" : u.done ? "Klar" : `${u.percent}%`}</span></div>{u.error ? <p className="mt-1 text-xs text-status-error">{u.error}</p> : <Progress value={u.percent} className="mt-2 h-1.5" />}</li>)}</ul> : null}
      </section>

      <section aria-label="Material" className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5"><Label htmlFor="search">Sök</Label><Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Namn, kategori eller tagg" className="w-64" /></div>
          <div className="space-y-1.5"><Label htmlFor="kind">Typ</Label><Select value={kindFilter} onValueChange={setKindFilter}><SelectTrigger id="kind" className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alla</SelectItem><SelectItem value="image">Bild</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="audio">Ljud</SelectItem><SelectItem value="document">Dokument</SelectItem></SelectContent></Select></div>
          <p className="pb-2 text-xs text-muted-foreground">{assets.length} mediaobjekt · datum = källdatum när det finns, annars skapad i Studio</p>
        </div>

        {isLoading ? <p className="text-sm text-muted-foreground">Hämtar material…</p> : error ? <p className="text-sm text-status-error">Materialet kunde inte hämtas: {error instanceof Error ? error.message : "okänt fel"}</p> : assets.length === 0 ? <p className="rounded-xl border border-border bg-card/60 p-6 text-sm text-muted-foreground">Inget material matchar.</p> : (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((a) => {
              const versions = (data?.versions ?? []).filter((v) => v.asset_id === a.id);
              const sourceDate = a.source_created_at ?? a.created_at;
              const external = a.external_source_url;
              return (
                <li key={a.id} className="flex flex-col rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl">
                  <MediaThumbnail asset={a} />
                  <div className="mt-4 flex items-start justify-between gap-3"><div className="min-w-0"><p className="flex items-center gap-2 font-semibold"><KindIcon kind={a.kind} /><span className="truncate">{a.name}</span></p><p className="mt-1 text-xs text-muted-foreground">{a.category} · {a.mime_type ?? "okänd typ"}{a.file_size ? ` · ${formatBytes(a.file_size)}` : ""}{a.width && a.height ? ` · ${a.width}×${a.height}` : ""}{a.duration_seconds ? ` · ${formatDuration(a.duration_seconds)}` : ""}</p></div><TruthBadge label={a.approval_status} /></div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px]"><span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-muted-foreground"><CalendarDays className="size-3" />{fmtDate(sourceDate)}</span>{a.brand_review_status ? <span className="rounded-full border border-primary/30 px-2 py-1 text-primary">Brand: {a.brand_review_status}</span> : null}{a.source_platform ? <span className="rounded-full border px-2 py-1 text-muted-foreground">{a.source_platform}</span> : null}</div>
                  <dl className="mt-3 space-y-1 text-xs text-muted-foreground"><div className="flex gap-2"><dt>Versioner:</dt><dd>{versions.length || 1}</dd></div><div className="flex gap-2"><dt>Rättigheter:</dt><dd>{a.usage_rights ?? "Ej angivet"}</dd></div></dl>
                  <div className="mt-4 space-y-2"><Label htmlFor={`approval-${a.id}`} className="text-xs">Sanningsstatus</Label><Select value={a.approval_status} onValueChange={(value) => { void update({ data: { id: a.id, approval_status: value } }).then(() => invalidate(), (err: unknown) => toast.error(err instanceof Error ? err.message : "Kunde inte spara.")); }}><SelectTrigger id={`approval-${a.id}`}><SelectValue /></SelectTrigger><SelectContent>{MEDIA_APPROVAL.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                  <Textarea aria-label={`Anteckningar för ${a.name}`} defaultValue={a.notes ?? ""} placeholder="Anteckningar, källa eller användningsvillkor" className="mt-3 min-h-[64px] text-xs" onBlur={(e) => { if (e.target.value !== (a.notes ?? "")) void update({ data: { id: a.id, notes: e.target.value } }).then(() => invalidate(), () => toast.error("Kunde inte spara anteckningen.")); }} />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={!a.storage_path || openLink.isPending} onClick={() => a.storage_path && openLink.mutate({ path: a.storage_path, download: false, name: a.name, kind: a.kind })}><Eye aria-hidden="true" />Förhandsvisa</Button>
                    {external ? <Button asChild size="sm" variant="outline"><a href={external} target="_blank" rel="noreferrer noopener"><ExternalLink aria-hidden="true" />Öppna källa</a></Button> : null}
                    <Button size="sm" variant="outline" disabled={!a.storage_path || openLink.isPending} onClick={() => a.storage_path && openLink.mutate({ path: a.storage_path, download: true, name: a.name, kind: a.kind })}><Download aria-hidden="true" />Ladda ner</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setVersionFor(a.id); versionInput.current?.click(); }}><Upload aria-hidden="true" />Ny version</Button>
                    <Button size="sm" variant="ghost" onClick={() => { void archive({ data: { id: a.id } }).then(() => { toast.success("Materialet arkiverades."); invalidate(); }, () => toast.error("Kunde inte arkivera.")); }}><Archive aria-hidden="true" />Arkivera</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{preview?.name}</DialogTitle><DialogDescription>Tidsbegränsad, signerad förhandsvisning.</DialogDescription></DialogHeader>{preview ? preview.kind === "video" ? <video src={preview.url} controls className="w-full rounded-lg" /> : preview.kind === "audio" ? <audio src={preview.url} controls className="w-full" /> : preview.kind === "image" ? <img src={preview.url} alt={preview.name} className="w-full rounded-lg" /> : <a href={preview.url} className="text-sm underline" target="_blank" rel="noreferrer">Öppna filen</a> : null}</DialogContent></Dialog>
    </div>
  );
}
