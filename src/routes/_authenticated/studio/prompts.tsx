import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createTemplate, listTemplates } from "@/lib/studio.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeading } from "@/components/studio/brand";
import { PromptDocCard } from "@/components/studio/PromptDocCard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/studio/prompts")({
  component: PromptLibrary,
});

function PromptLibrary() {
  const qc = useQueryClient();
  const fetchTemplates = useServerFn(listTemplates);
  const addTemplate = useServerFn(createTemplate);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["templates"],
    queryFn: () => fetchTemplates(),
  });

  const [form, setForm] = useState({ name: "", category: "", description: "", body: "" });

  const mutation = useMutation({
    mutationFn: () =>
      addTemplate({
        data: {
          name: form.name,
          category: form.category || "Egen",
          description: form.description || null,
          body: form.body,
        },
      }),
    onSuccess: () => {
      toast.success("Promptmall sparad.");
      setForm({ name: "", category: "", description: "", body: "" });
      void qc.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Kunde inte spara."),
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Promptbibliotek"
        title="Mallar per målgrupp"
        description="Inbyggda ParkKey-mallar plus egna mallar. Kopiera eller ladda ner som .md."
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : isError ? (
        <div className="surface-glass rounded-xl p-6">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Kunde inte hämta mallar."}
          </p>
          <Button className="mt-4" onClick={() => void refetch()}>
            Försök igen
          </Button>
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="surface-glass rounded-xl p-8 text-center text-sm text-muted-foreground">
          Inga promptmallar ännu.
        </p>
      ) : (
        <ul className="space-y-4">
          {data?.map((t) => (
            <li key={t.id}>
              <PromptDocCard
                title={`${t.name}${t.category ? ` · ${t.category}` : ""}`}
                content={t.body}
                filenameBase={t.name}
                {...(t.description ? { description: t.description } : {})}
              />
            </li>
          ))}
        </ul>
      )}

      <form
        className="surface-glass space-y-4 rounded-xl p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.name.trim() || !form.body.trim()) {
            toast.error("Namn och promptinnehåll krävs.");
            return;
          }
          mutation.mutate();
        }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          Ny egen mall
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="t-name">Namn *</Label>
            <Input
              id="t-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-cat">Kategori</Label>
            <Input
              id="t-cat"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-desc">Beskrivning</Label>
          <Input
            id="t-desc"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-body">Promptinnehåll *</Label>
          <Textarea
            id="t-body"
            rows={8}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Sparar…" : "Spara mall"}
        </Button>
      </form>
    </div>
  );
}
