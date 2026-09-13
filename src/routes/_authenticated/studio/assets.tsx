import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { createAsset, listAssets } from "@/lib/studio.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeading } from "@/components/studio/brand";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/studio/assets")({
  component: AssetLibrary,
});

const CATEGORIES = [
  "Logotyp",
  "Parky-referens",
  "Key art",
  "Bildreferens",
  "Videoreferens",
  "Musikreferens",
  "CTA-referens",
  "Brand asset",
] as const;

const KINDS = ["image", "video", "audio", "document", "link"] as const;

const DEFAULT_CATEGORY: string = CATEGORIES[0];
const DEFAULT_KIND: string = KINDS[0];

function AssetLibrary() {
  const qc = useQueryClient();
  const fetchAssets = useServerFn(listAssets);
  const addAsset = useServerFn(createAsset);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["assets"],
    queryFn: () => fetchAssets(),
  });

  const [form, setForm] = useState<{
    name: string;
    category: string;
    kind: string;
    url: string;
    notes: string;
    tags: string;
  }>({
    name: "",
    category: DEFAULT_CATEGORY,
    kind: DEFAULT_KIND,
    url: "",
    notes: "",
    tags: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      addAsset({
        data: {
          name: form.name,
          category: form.category,
          kind: form.kind,
          url: form.url || null,
          notes: form.notes || null,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("Asset registrerad.");
      setForm({ name: "", category: CATEGORIES[0], kind: KINDS[0], url: "", notes: "", tags: "" });
      void qc.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Kunde inte spara."),
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Asset-bibliotek"
        title="Logotyper, Parky-referenser och brandmaterial"
        description="Registrera och klassificera referensmaterial. Assets utan fil visas som saknad fil — aldrig som klar."
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : isError ? (
        <div className="surface-glass rounded-xl p-6">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Kunde inte hämta assets."}
          </p>
          <Button className="mt-4" onClick={() => void refetch()}>
            Försök igen
          </Button>
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="surface-glass rounded-xl p-8 text-center text-sm text-muted-foreground">
          Inga assets registrerade ännu.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((a) => (
            <li key={a.id} className="surface-glass rounded-xl p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-primary">{a.category}</p>
              <h3 className="mt-2 font-semibold text-foreground">{a.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Typ: {a.kind}</p>
              {a.url && a.kind === "image" ? (
                <img
                  src={a.url}
                  alt={a.name}
                  loading="lazy"
                  className="mt-3 aspect-video w-full rounded-lg border border-border object-cover"
                />
              ) : null}
              {a.notes ? (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{a.notes}</p>
              ) : null}
              {a.url ? (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                  Öppna fil
                </a>
              ) : (
                <p className="mt-3 text-xs font-medium text-warning">Ingen fil kopplad ännu</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="surface-glass space-y-4 rounded-xl p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.name.trim()) {
            toast.error("Namn krävs.");
            return;
          }
          mutation.mutate();
        }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Ny asset</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="a-name">Namn *</Label>
            <Input
              id="a-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-url">Fil-URL</Label>
            <Input
              id="a-url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-cat">Kategori</Label>
            <select
              id="a-cat"
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-kind">Typ</Label>
            <select
              id="a-kind"
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
              value={form.kind}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="a-notes">Anteckningar</Label>
          <Textarea
            id="a-notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="a-tags">Taggar</Label>
          <Input
            id="a-tags"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          />
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Sparar…" : "Registrera asset"}
        </Button>
      </form>
    </div>
  );
}
