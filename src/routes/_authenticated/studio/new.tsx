import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { createProject, listTemplates } from "@/lib/studio.functions";
import { DURATION_PRESETS, EXPORT_PRESETS, TRUTH_LABELS } from "@/lib/parkkey-rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SectionHeading } from "@/components/studio/brand";

export const Route = createFileRoute("/_authenticated/studio/new")({
  component: FilmCreator,
});

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function FilmCreator() {
  const navigate = useNavigate();
  const create = useServerFn(createProject);
  const fetchTemplates = useServerFn(listTemplates);
  const { data: templates } = useQuery({
    queryKey: ["templates"],
    queryFn: () => fetchTemplates(),
  });

  const [form, setForm] = useState({
    title: "",
    campaign: "",
    goal: "",
    audience: "",
    duration_seconds: 30,
    preset: "16x9",
    channel: "",
    cta: "",
    visual_mood: "",
    location_time: "",
    parky_usage: "",
    device_interaction: "",
    music_direction: "",
    voice_enabled: false,
    subtitles_enabled: false,
    sfx_enabled: false,
    reference_media: "",
    notes: "",
    truth_label: "DEMO",
    tags: "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const preset = EXPORT_PRESETS.find((p) => p.id === form.preset) ?? EXPORT_PRESETS[0];
      return create({
        data: {
          title: form.title,
          campaign: form.campaign || null,
          goal: form.goal || null,
          audience: form.audience || null,
          duration_seconds: Number(form.duration_seconds),
          aspect_ratio: preset.aspect,
          resolution: preset.resolution,
          fps: 30,
          channel: form.channel || null,
          cta: form.cta || null,
          visual_mood: form.visual_mood || null,
          location_time: form.location_time || null,
          parky_usage: form.parky_usage || null,
          device_interaction: form.device_interaction || null,
          music_direction: form.music_direction || null,
          voice_enabled: form.voice_enabled,
          subtitles_enabled: form.subtitles_enabled,
          sfx_enabled: form.sfx_enabled,
          reference_media: form.reference_media || null,
          notes: form.notes || null,
          truth_label: form.truth_label,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
      });
    },
    onSuccess: (res) => {
      toast.success("Filmprojekt skapat och produktionspaket genererat.");
      navigate({ to: "/studio/project/$id", params: { id: res.projectId } });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Kunde inte spara."),
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Film Creator"
        title="Ny ParkKey-film"
        description="Fyll i briefen. Studion väver in ParkKeys regler och genererar hela produktionspaketet när du sparar."
      />

      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) {
            toast.error("Titel krävs.");
            return;
          }
          mutation.mutate();
        }}
      >
        <fieldset className="surface-glass space-y-5 rounded-xl p-5">
          <legend className="px-1 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Kampanj och mål
          </legend>
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="title" label="Titel *">
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </Field>
            <Field id="campaign" label="Kampanj">
              <Input
                id="campaign"
                value={form.campaign}
                onChange={(e) => set("campaign", e.target.value)}
              />
            </Field>
            <Field id="goal" label="Kampanjmål">
              <Textarea id="goal" value={form.goal} onChange={(e) => set("goal", e.target.value)} />
            </Field>
            <Field id="audience" label="Målgrupp">
              <Textarea
                id="audience"
                value={form.audience}
                onChange={(e) => set("audience", e.target.value)}
              />
            </Field>
            <Field id="channel" label="Kanal">
              <Input
                id="channel"
                placeholder="LinkedIn, YouTube pre-roll, mässa, investerarmöte…"
                value={form.channel}
                onChange={(e) => set("channel", e.target.value)}
              />
            </Field>
            <Field id="cta" label="CTA" hint="Verifiera länk och budskap innan publicering.">
              <Input id="cta" value={form.cta} onChange={(e) => set("cta", e.target.value)} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="surface-glass space-y-5 rounded-xl p-5">
          <legend className="px-1 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Format och längd
          </legend>
          <div className="grid gap-5 md:grid-cols-3">
            <Field id="duration" label="Längd (sekunder)">
              <select
                id="duration"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
                value={form.duration_seconds}
                onChange={(e) => set("duration_seconds", Number(e.target.value))}
              >
                {DURATION_PRESETS.map((d) => (
                  <option key={d} value={d}>
                    {d} sek
                  </option>
                ))}
              </select>
            </Field>
            <Field id="preset" label="Målformat" hint="30 fps och H.264 MP4-master som standard.">
              <select
                id="preset"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
                value={form.preset}
                onChange={(e) => set("preset", e.target.value)}
              >
                {EXPORT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} — {p.resolution}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="truth" label="Bevisstatus">
              <select
                id="truth"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
                value={form.truth_label}
                onChange={(e) => set("truth_label", e.target.value)}
              >
                {TRUTH_LABELS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </fieldset>

        <fieldset className="surface-glass space-y-5 rounded-xl p-5">
          <legend className="px-1 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Visuell riktning
          </legend>
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="mood" label="Visuell mood">
              <Textarea
                id="mood"
                value={form.visual_mood}
                onChange={(e) => set("visual_mood", e.target.value)}
              />
            </Field>
            <Field id="location" label="Plats och tid">
              <Textarea
                id="location"
                value={form.location_time}
                onChange={(e) => set("location_time", e.target.value)}
              />
            </Field>
            <Field
              id="parky"
              label="Parky-användning"
              hint="Parky är guide och belöningsmoment — inte dekoration."
            >
              <Textarea
                id="parky"
                value={form.parky_usage}
                onChange={(e) => set("parky_usage", e.target.value)}
              />
            </Field>
            <Field id="device" label="Enhets- och produktinteraktion">
              <Textarea
                id="device"
                value={form.device_interaction}
                onChange={(e) => set("device_interaction", e.target.value)}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="surface-glass space-y-5 rounded-xl p-5">
          <legend className="px-1 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Ljud
          </legend>
          <Field id="music" label="Musikriktning">
            <Textarea
              id="music"
              value={form.music_direction}
              onChange={(e) => set("music_direction", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ["voice_enabled", "Voiceover"],
                ["subtitles_enabled", "Undertexter"],
                ["sfx_enabled", "Ljudeffekter"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <Label htmlFor={key} className="text-sm">
                  {label}
                </Label>
                <Switch
                  id={key}
                  checked={form[key]}
                  onCheckedChange={(v) => set(key, v)}
                  aria-label={label}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Avstängt reglage blir en hård regel i prompten och en punkt i QA-grinden.
          </p>
        </fieldset>

        <fieldset className="surface-glass space-y-5 rounded-xl p-5">
          <legend className="px-1 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Referenser och anteckningar
          </legend>
          <Field
            id="references"
            label="Referensmedia"
            hint="Länkar eller namn på uppladdade referenser i Asset-biblioteket."
          >
            <Textarea
              id="references"
              value={form.reference_media}
              onChange={(e) => set("reference_media", e.target.value)}
            />
          </Field>
          <Field id="notes" label="Anteckningar">
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
          <Field id="tags" label="Taggar" hint="Kommaseparerade, t.ex. parky-test, mobile-first">
            <Input id="tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </Field>
        </fieldset>

        {templates?.length ? (
          <p className="text-xs text-muted-foreground">
            {templates.length} promptmallar finns tillgängliga i promptbiblioteket som utgångspunkt.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            <Wand2 aria-hidden="true" />
            {mutation.isPending ? "Genererar produktionspaket…" : "Spara och generera prompts"}
          </Button>
        </div>
      </form>
    </div>
  );
}
