import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Inbox, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import {
  createUploadTarget,
  listMedia,
  MEDIA_CATEGORIES,
  registerMediaAsset,
} from "@/lib/media.functions";
import { probeMedia, uploadToSignedUrl } from "@/lib/upload";
import { SectionHeading } from "@/components/studio/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/studio/intake")({
  component: VisualIntakePage,
});

function readParam(name: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name)?.trim() ?? "";
}

function VisualIntakePage() {
  const queryClient = useQueryClient();
  const fetchMedia = useServerFn(listMedia);
  const target = useServerFn(createUploadTarget);
  const register = useServerFn(registerMediaAsset);
  const { data, isLoading } = useQuery({ queryKey: ["media"], queryFn: () => fetchMedia() });
  const fileInput = useRef<HTMLInputElement>(null);

  const initialProject = readParam("project");
  const initialCampaign = readParam("campaign");
  const initialCategory = readParam("category");
  const initialSource = readParam("source") || "CoreOS / ParkKey visual intake";
  const coreosType = readParam("coreos_type");
  const coreosId = readParam("coreos_id");
  const coreosLabel = readParam("coreos_label");

  const projects = data?.projects ?? [];
  const validInitialProject = useMemo(
    () => (projects.some((project) => project.id === initialProject) ? initialProject : "none"),
    [initialProject, projects],
  );

  const [projectId, setProjectId] = useState(validInitialProject);
  const [campaign, setCampaign] = useState(initialCampaign);
  const [category, setCategory] = useState(
    MEDIA_CATEGORIES.includes(initialCategory as (typeof MEDIA_CATEGORIES)[number])
      ? initialCategory
      : "Socialt material",
  );
  const [source, setSource] = useState(initialSource);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const probe = await probeMedia(file);
        const upload = await target({
          data: { fileName: file.name, mimeType: file.type, size: file.size },
        });
        await uploadToSignedUrl(upload.signedUrl, file, () => undefined);
        await register({
          data: {
            name: file.name.replace(/\.[^.]+$/, ""),
            storage_path: upload.path,
            mime_type: file.type,
            file_size: file.size,
            width: probe.width,
            height: probe.height,
            duration_seconds: probe.duration_seconds,
            category,
            film_project_id: projectId === "none" ? null : projectId,
            campaign: campaign.trim() || null,
            usage_rights: "Kontrollera källa/rättigheter före extern publicering",
            source_notes: source.trim() || null,
            notes:
              coreosId || coreosLabel
                ? `CoreOS: ${coreosType || "context"} · ${coreosLabel || coreosId} · ${coreosId}`
                : "Visuell inkorg",
            tags: ["visual-intake", coreosType ? `coreos-${coreosType}` : "parkkey"],
          },
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["media"] });
      toast.success("Materialet ligger nu i Film Studios mediabibliotek på vald plats.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Materialet kunde inte tas emot.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Unified intake"
        title="Visuell inkorg"
        description="En gemensam ingång för material från CoreOS, ChatGPT-arbete, Lovable eller manuell uppladdning. Allt hamnar i samma privata Film Studio-bibliotek och märks först som DEMO tills det har granskats."
      />

      <section className="surface-glass rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <Inbox aria-hidden="true" className="mt-0.5 size-5 text-primary" />
          <div>
            <h2 className="font-semibold text-foreground">Placera rätt från början</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Välj filmprojekt, kampanj och klassificering innan filen skickas in. CoreOS-kontext följer
              med automatiskt när inkorgen öppnas från en CoreOS-länk.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="intake-project">Filmprojekt</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={isLoading}>
              <SelectTrigger id="intake-project">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen särskild film</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="intake-campaign">Kampanj / inlägg</Label>
            <Input
              id="intake-campaign"
              value={campaign}
              onChange={(event) => setCampaign(event.target.value)}
              placeholder="t.ex. LinkedIn · Håbo pilot"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="intake-category">Typ av material</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="intake-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="intake-source">Källa</Label>
            <Input
              id="intake-source"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="ChatGPT, CoreOS, Lovable…"
            />
          </div>
        </div>

        {coreosId || coreosLabel ? (
          <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            CoreOS-kontext: {coreosType || "post"} · {coreosLabel || coreosId} · {coreosId}
          </p>
        ) : null}

        <div className="mt-6 rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <UploadCloud aria-hidden="true" className="mx-auto size-8 text-primary" />
          <p className="mt-3 font-semibold text-foreground">Skicka material till Film Studio</p>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
            Bilder, video, ljud eller PDF lagras privat och registreras med vald kampanj/projektkontext.
            Uppladdning betyder inte godkänd publicering.
          </p>
          <Button className="mt-5" onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? "Tar emot material…" : "Välj filer"}
          </Button>
          <input
            ref={fileInput}
            type="file"
            multiple
            className="sr-only"
            aria-label="Välj filer till Film Studio"
            onChange={(event) => void handleFiles(event.target.files)}
          />
        </div>
      </section>
    </div>
  );
}
