import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";

import {
  createSocialPost,
  listSocialPosts,
  regenerateSocialCreative,
  setSocialPostStatus,
} from "@/lib/social.functions";
import { createUploadTarget, registerMediaAsset } from "@/lib/media.functions";
import { uploadToSignedUrl } from "@/lib/upload";
import { dataUrlToFile, streamGeneratedImage } from "@/lib/stream-image";
import { SOCIAL_ASPECTS, SOCIAL_NETWORKS } from "@/lib/social-engine";
import { listIntegrations } from "@/lib/integrations.functions";
import { SectionHeading } from "@/components/studio/brand";
import { TruthBadge } from "@/components/studio/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/studio/social")({
  head: () => ({
    meta: [
      { title: "Social Creative Studio — ParkKey™ Film Studio" },
      {
        name: "description",
        content:
          "Skapa ParkKey-styrda bildkoncept, copy, bildprompt, negativlista, alt-text och kravkontroll för sociala inlägg.",
      },
      { property: "og:title", content: "Social Creative Studio — ParkKey™ Film Studio" },
      {
        property: "og:description",
        content: "Kreativa paket för sociala inlägg enligt ParkKeys varumärkes- och bevisregler.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SocialPage,
});

function CopyBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            toast.success(`${label} kopierad.`);
          }}
        >
          <Copy aria-hidden="true" />
          Kopiera
        </Button>
      </div>
      <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-foreground/90">{value}</pre>
    </div>
  );
}

const ASPECT_HINT: Record<string, string> = {
  "1:1": "kvadratiskt format 1200x1200 för LinkedIn-flödet",
  "4:5": "stående format 1080x1350 för LinkedIn-flödet",
  "1.91:1": "liggande format 1200x627 för LinkedIn-flödet",
  "16:9": "liggande biografformat 1920x1080",
  "9:16": "stående helskärmsformat 1080x1920",
};

/** Bildgenerering per kreativt paket. Ingen bild visas som genererad förrän den finns. */
function ImagePanel({
  post,
  connected,
}: {
  post: {
    id: string;
    title: string;
    image_prompt: string | null;
    negative_prompt: string | null;
    alt_text: string | null;
    aspect_ratio: string;
    campaign: string | null;
    truth_label: string;
  };
  connected: boolean;
}) {
  const target = useServerFn(createUploadTarget);
  const register = useServerFn(registerMediaAsset);
  const [frame, setFrame] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  if (!connected) {
    return (
      <div className="rounded-lg border border-status-unknown/40 bg-background/60 p-4 text-sm">
        <p className="font-semibold">Generator inte ansluten</p>
        <p className="mt-1 text-muted-foreground">
          Bildprompten och negativlistan ovan är fullt användbara i valfritt bildverktyg. Ingen bild
          genereras här förrän anslutningen är verifierad under Integrationer.
        </p>
      </div>
    );
  }

  async function generate() {
    if (!post.image_prompt) {
      toast.error("Paketet saknar bildprompt.");
      return;
    }
    setRunning(true);
    setFailed(null);
    setSaved(false);
    setIsFinal(false);
    setFrame(null);
    try {
      const prompt = `${post.image_prompt}\n\nLevereras i ${
        ASPECT_HINT[post.aspect_ratio] ?? post.aspect_ratio
      }. Ingen text, inga logotyper och inga bokstäver i bilden.`;
      await streamGeneratedImage(prompt, post.negative_prompt, (dataUrl, final) => {
        setFrame(dataUrl);
        if (final) setIsFinal(true);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bildgenereringen misslyckades.";
      setFailed(message);
      toast.error(message);
    } finally {
      setRunning(false);
    }
  }

  async function saveToLibrary() {
    if (!frame || !isFinal) return;
    setSaving(true);
    try {
      const file = dataUrlToFile(frame, `${post.title.slice(0, 40) || "parkkey-bild"}.png`);
      const up = await target({
        data: { fileName: file.name, mimeType: file.type, size: file.size },
      });
      await uploadToSignedUrl(up.signedUrl, file, () => {});
      const dims = await new Promise<{ width: number | null; height: number | null }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: null, height: null });
        img.src = frame;
      });
      await register({
        data: {
          name: `${post.title} — genererad bild`,
          storage_path: up.path,
          mime_type: file.type,
          file_size: file.size,
          width: dims.width,
          height: dims.height,
          category: "Social creative",
          tags: ["genererad", post.aspect_ratio],
          campaign: post.campaign,
          usage_rights: "AI-genererad via ParkKeys AI-anslutning. Kräver granskning före kundbruk.",
          source_notes: `Genererad från Social Creative-paket ${post.id}. Sanningsläge: ${post.truth_label}.`,
          notes: post.alt_text,
        },
      });
      setSaved(true);
      toast.success("Bilden sparad i mediabiblioteket som DEMO.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte spara bilden.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-background/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Bildgenerering
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => void generate()}
            disabled={running || !post.image_prompt}
          >
            <Sparkles aria-hidden="true" />
            {running ? "Genererar…" : frame ? "Generera igen" : "Generera bild"}
          </Button>
          {frame && isFinal ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void saveToLibrary()}
              disabled={saving || saved}
            >
              {saved ? "Sparad i biblioteket" : saving ? "Sparar…" : "Spara i mediabiblioteket"}
            </Button>
          ) : null}
        </div>
      </div>

      <div aria-live="polite" className="mt-3">
        {failed ? (
          <p className="text-sm text-status-error">{failed}</p>
        ) : frame ? (
          <figure className="space-y-2">
            <img
              src={frame}
              alt={isFinal ? (post.alt_text ?? `Genererad bild för ${post.title}`) : ""}
              className={
                isFinal
                  ? "w-full max-w-md rounded-lg blur-0 transition-[filter] duration-300"
                  : "w-full max-w-md rounded-lg blur-2xl transition-[filter] duration-300"
              }
            />
            <figcaption className="text-xs text-muted-foreground">
              {isFinal
                ? "Färdig bild. Sanningsläge DEMO tills den granskats och godkänts."
                : "Bilden byggs upp…"}
            </figcaption>
          </figure>
        ) : running ? (
          <p className="text-sm text-muted-foreground">Bildgenereringen har startat…</p>
        ) : (
          <p className="text-sm text-muted-foreground">Ingen bild genererad ännu.</p>
        )}
      </div>
    </div>
  );
}

function SocialPage() {
  const qc = useQueryClient();
  const fetchPosts = useServerFn(listSocialPosts);
  const fetchIntegrations = useServerFn(listIntegrations);
  const create = useServerFn(createSocialPost);
  const regenerate = useServerFn(regenerateSocialCreative);
  const setStatus = useServerFn(setSocialPostStatus);

  const { data, isLoading, error } = useQuery({
    queryKey: ["social"],
    queryFn: () => fetchPosts(),
  });
  const integrations = useQuery({ queryKey: ["integrations"], queryFn: () => fetchIntegrations() });

  const imageGen = (integrations.data?.connections ?? []).find(
    (c) => c.provider === "image-generation",
  );
  const generatorConnected = imageGen?.status === "CONNECTED";

  const [form, setForm] = useState({
    title: "",
    objective: "",
    audience: "",
    campaign: "",
    network: "LinkedIn",
    aspect_ratio: "1:1",
    cta: "ParkKey.org/test",
    copy_direction: "",
    parky_usage: "",
    cinematic_mood: "",
    image_references: "",
    truth_label: "DEMO",
  });
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["social"] });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Ge inlägget en titel.");
      return;
    }
    setBusy(true);
    try {
      const row = await create({ data: form });
      toast.success("Kreativt paket genererat.");
      setOpenId(row.id);
      setForm((f) => ({ ...f, title: "", objective: "" }));
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte skapa paketet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Social Creative"
        title="Social Creative Studio"
        description="Bildkoncept, copy, bildprompt, negativlista, alt-text och kravkontroll — genererat enligt ParkKeys varumärkes-, bild- och bevisregler."
      />

      <div
        className="flex items-start gap-3 rounded-xl border border-status-unknown/40 bg-card/60 p-4 text-sm"
        role="status"
      >
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 text-status-unknown" />
        <p>
          {generatorConnected
            ? "Bildgenerator ansluten. Kreativa paket kan kompletteras med genererade bildvarianter."
            : "Generator inte ansluten — inga bilder genereras här. Hela det kreativa paketet (copy, bildprompt, negativlista, alt-text, croppresets) är fullt användbart och kan köras i valfritt bildverktyg."}
        </p>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-xl md:grid-cols-2"
      >
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="title">Titel</Label>
          <Input
            id="title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="t.ex. Parky-testet — LinkedIn-lansering"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="objective">Syfte med inlägget</Label>
          <Input
            id="objective"
            value={form.objective}
            onChange={(e) => setForm({ ...form, objective: e.target.value })}
            placeholder="Visa att belöningen kan läggas i befintlig app"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="audience">Målgrupp</Label>
          <Input
            id="audience"
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}
            placeholder="Kommuner, mobilitetsoperatörer"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign">Kampanj</Label>
          <Input
            id="campaign"
            value={form.campaign}
            onChange={(e) => setForm({ ...form, campaign: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="network">Kanal</Label>
          <Select value={form.network} onValueChange={(v) => setForm({ ...form, network: v })}>
            <SelectTrigger id="network">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOCIAL_NETWORKS.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aspect">Format</Label>
          <Select
            value={form.aspect_ratio}
            onValueChange={(v) => setForm({ ...form, aspect_ratio: v })}
          >
            <SelectTrigger id="aspect">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOCIAL_ASPECTS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cta">CTA</Label>
          <Input
            id="cta"
            value={form.cta}
            onChange={(e) => setForm({ ...form, cta: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="parky">Parky-användning</Label>
          <Input
            id="parky"
            value={form.parky_usage}
            onChange={(e) => setForm({ ...form, parky_usage: e.target.value })}
            placeholder="Belöningsguide i belöningsögonblicket"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mood">Filmisk känsla</Label>
          <Input
            id="mood"
            value={form.cinematic_mood}
            onChange={(e) => setForm({ ...form, cinematic_mood: e.target.value })}
            placeholder="Solig nordisk höst, mjukt sidoljus"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="truth">Sanningsetikett</Label>
          <Select
            value={form.truth_label}
            onValueChange={(v) => setForm({ ...form, truth_label: v })}
          >
            <SelectTrigger id="truth">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["DEMO", "EXAMPLE", "HYPOTHESIS", "TARGET", "PROPOSED", "CONFIRMED"].map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="dir">Copyriktning</Label>
          <Textarea
            id="dir"
            value={form.copy_direction}
            onChange={(e) => setForm({ ...form, copy_direction: e.target.value })}
            placeholder="Första raden används som rubrik."
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="refs">Bildreferenser</Label>
          <Textarea
            id="refs"
            value={form.image_references}
            onChange={(e) => setForm({ ...form, image_references: e.target.value })}
            placeholder="Namn på referensmaterial i mediabiblioteket"
          />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={busy}>
            <Sparkles aria-hidden="true" />
            {busy ? "Genererar…" : "Generera kreativt paket"}
          </Button>
        </div>
      </form>

      <section aria-label="Kreativa paket" className="space-y-4">
        <h2 className="text-lg font-semibold">Sparade paket</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground" role="status">
            Hämtar paket…
          </p>
        ) : error ? (
          <p className="text-sm text-status-error">
            Kunde inte hämta paketen: {error instanceof Error ? error.message : "okänt fel"}
          </p>
        ) : (data?.posts ?? []).length === 0 ? (
          <p className="rounded-xl border border-border bg-card/60 p-6 text-sm text-muted-foreground">
            Inga paket ännu. Fyll i briefen ovan för att generera det första.
          </p>
        ) : (
          <ul className="space-y-4">
            {(data?.posts ?? []).map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur-xl"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.network} · {p.aspect_ratio} · {p.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TruthBadge label={p.truth_label} />
                    {p.status === "DRAFT" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void setStatus({ data: { id: p.id, status: "REVIEW" } }).then(
                            () => invalidate(),
                            (err: unknown) =>
                              toast.error(err instanceof Error ? err.message : "Kunde inte ändra."),
                          )
                        }
                      >
                        Till granskning
                      </Button>
                    ) : null}
                    {p.status === "REVIEW" ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          void setStatus({ data: { id: p.id, status: "APPROVED" } }).then(
                            () => invalidate(),
                            (err: unknown) =>
                              toast.error(err instanceof Error ? err.message : "Kunde inte ändra."),
                          )
                        }
                      >
                        Godkänn
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void regenerate({ data: { id: p.id } }).then(
                          () => {
                            toast.success("Paketet regenererades.");
                            invalidate();
                          },
                          () => toast.error("Kunde inte regenerera."),
                        )
                      }
                    >
                      <RefreshCw aria-hidden="true" />
                      Regenerera
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-expanded={openId === p.id}
                      onClick={() => setOpenId(openId === p.id ? null : p.id)}
                    >
                      {openId === p.id ? "Stäng" : "Visa paket"}
                    </Button>
                  </div>
                </div>

                {openId === p.id ? (
                  <div className="mt-4 space-y-3">
                    <CopyBlock label="Copy (SV)" value={p.copy_sv} />
                    <CopyBlock label="Copy (EN)" value={p.copy_en} />
                    <CopyBlock label="Rubrik" value={p.headline} />
                    <CopyBlock label="Overlay-copy" value={p.overlay_copy} />
                    <CopyBlock label="Bildprompt" value={p.image_prompt} />
                    <CopyBlock label="Negativ prompt" value={p.negative_prompt} />
                    <CopyBlock label="Alt-text" value={p.alt_text} />
                    <CopyBlock label="Kravkontroll" value={p.claim_check} />
                    <CopyBlock label="Croppresets" value={p.crop_presets.join("\n")} />
                    <ImagePanel post={p} connected={generatorConnected} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
