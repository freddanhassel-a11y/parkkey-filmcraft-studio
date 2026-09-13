import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarClock, Copy, Linkedin, Send, TriangleAlert } from "lucide-react";

import {
  attemptPublish,
  duplicateSocialPost,
  listSocialPosts,
  scheduleSocialPost,
  setSocialPostAssets,
  setSocialPostStatus,
  updateSocialPost,
} from "@/lib/social.functions";
import { getLinkedInCapability } from "@/lib/linkedin-capability.functions";
import { SectionHeading } from "@/components/studio/brand";
import { StatusBadge, TruthBadge } from "@/components/studio/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/studio/linkedin")({
  head: () => ({
    meta: [
      { title: "LinkedIn Studio — ParkKey™ Film Studio" },
      {
        name: "description",
        content:
          "Bygg, granska, godkänn och schemalägg ParkKey-inlägg för LinkedIn med bilagor, alt-text och sanningsenlig köstatus.",
      },
      { property: "og:title", content: "LinkedIn Studio — ParkKey™ Film Studio" },
      {
        property: "og:description",
        content: "Intern LinkedIn-arbetsyta med granskningsflöde, schema och spårlogg.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LinkedInPage,
});

function LinkedInPage() {
  const qc = useQueryClient();
  const fetchPosts = useServerFn(listSocialPosts);
  const fetchCapability = useServerFn(getLinkedInCapability);
  const update = useServerFn(updateSocialPost);
  const setStatus = useServerFn(setSocialPostStatus);
  const setAssets = useServerFn(setSocialPostAssets);
  const schedule = useServerFn(scheduleSocialPost);
  const publish = useServerFn(attemptPublish);
  const duplicate = useServerFn(duplicateSocialPost);

  const { data, isLoading, error } = useQuery({
    queryKey: ["social"],
    queryFn: () => fetchPosts(),
  });
  const capability = useQuery({
    queryKey: ["linkedin-capability"],
    queryFn: () => fetchCapability(),
  });
  const connected = capability.data?.publishCapable === true;

  const posts = useMemo(() => (data?.posts ?? []).filter((p) => p.network === "LinkedIn"), [data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = posts.find((p) => p.id === selectedId) ?? posts[0] ?? null;

  const [when, setWhen] = useState("");
  const [tz, setTz] = useState("Europe/Stockholm");
  const invalidate = () => void qc.invalidateQueries({ queryKey: ["social"] });

  const attachedIds = (data?.postAssets ?? [])
    .filter((a) => a.post_id === selected?.id)
    .map((a) => a.media_asset_id);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="LinkedIn"
        title="LinkedIn Studio"
        description="Skapa inlägg från filmmaterial eller från början, granska, godkänn, bifoga media och lägg i schemakö. Publicering sker aldrig utan verifierad anslutning och verkligt API-svar."
      />

      <div
        className={`flex flex-wrap items-start gap-3 rounded-xl border p-4 text-sm ${
          connected ? "border-status-verified/50 bg-card/60" : "border-status-unknown/40 bg-card/60"
        }`}
        role="status"
      >
        <TriangleAlert
          aria-hidden="true"
          className={`mt-0.5 size-4 ${connected ? "text-status-verified" : "text-status-unknown"}`}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">LinkedIn capability</span>
            <StatusBadge status={capability.data?.state ?? "MANUAL CHECK"} />
          </div>
          <p>
            {capability.isLoading
              ? "Verifierar LinkedIn mot CoreOS…"
              : capability.isError
                ? "LinkedIn-kapaciteten kunde inte verifieras. Ingen publicering antas vara tillgänglig."
                : capability.data?.note}
          </p>
          {capability.data?.displayName ? (
            <p className="text-xs text-muted-foreground">
              {capability.data.displayName}
              {capability.data.observedPrincipal ? ` · ${capability.data.observedPrincipal}` : ""}
              {capability.data.purpose ? ` · syfte: ${capability.data.purpose}` : ""}
            </p>
          ) : null}
          {(capability.data?.grantedScopes.length ?? 0) > 0 ? (
            <p className="break-words text-xs text-muted-foreground">
              Verifierade scopes i CoreOS: {capability.data?.grantedScopes.join(", ")}
            </p>
          ) : null}
          {connected ? (
            <p className="text-xs text-muted-foreground">
              CoreOS har verifierat kontot och publiceringsavsedd kapacitet. Film Studio markerar
              ändå aldrig något som PUBLISHED förrän publiceringsadaptern har ett verkligt
              post-ID/URL från LinkedIn.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Schemaläggning fungerar som intern kö med status SCHEDULED — CONNECTION REQUIRED.
              Inget publiceras externt.
            </p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/studio/integrations">Integrationer</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Hämtar inlägg…
        </p>
      ) : error ? (
        <p className="text-sm text-status-error">
          Kunde inte hämta inlägg: {error instanceof Error ? error.message : "okänt fel"}
        </p>
      ) : posts.length === 0 ? (
        <p className="rounded-xl border border-border bg-card/60 p-6 text-sm text-muted-foreground">
          Inga LinkedIn-inlägg ännu. Skapa ett kreativt paket i{" "}
          <Link to="/studio/social" className="underline">
            Social Creative
          </Link>{" "}
          med kanal LinkedIn.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <nav aria-label="Inlägg" className="space-y-2">
            {posts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                aria-current={selected?.id === p.id}
                className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                  selected?.id === p.id
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card/60 hover:bg-accent/50"
                }`}
              >
                <span className="font-medium">{p.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{p.status}</span>
              </button>
            ))}
          </nav>

          {selected ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{selected.title}</h2>
                  <div className="flex items-center gap-2">
                    <TruthBadge label={selected.truth_label} />
                    <StatusBadge status={selected.status} />
                  </div>
                </div>

                <Tabs defaultValue="sv" className="mt-4">
                  <TabsList>
                    <TabsTrigger value="sv">Svenska</TabsTrigger>
                    <TabsTrigger value="en">Engelska</TabsTrigger>
                  </TabsList>
                  <TabsContent value="sv" className="mt-3">
                    <Label htmlFor="copy-sv">Inläggstext (SV)</Label>
                    <Textarea
                      id="copy-sv"
                      defaultValue={selected.copy_sv ?? ""}
                      className="mt-1.5 min-h-[200px]"
                      onBlur={(e) =>
                        void update({
                          data: { id: selected.id, patch: { copy_sv: e.target.value } },
                        }).then(
                          () => invalidate(),
                          () => toast.error("Kunde inte spara texten."),
                        )
                      }
                    />
                  </TabsContent>
                  <TabsContent value="en" className="mt-3">
                    <Label htmlFor="copy-en">Inläggstext (EN)</Label>
                    <Textarea
                      id="copy-en"
                      defaultValue={selected.copy_en ?? ""}
                      className="mt-1.5 min-h-[200px]"
                      onBlur={(e) =>
                        void update({
                          data: { id: selected.id, patch: { copy_en: e.target.value } },
                        }).then(
                          () => invalidate(),
                          () => toast.error("Kunde inte spara texten."),
                        )
                      }
                    />
                  </TabsContent>
                </Tabs>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="alt">Alt-text (tillgänglighet)</Label>
                    <Textarea
                      id="alt"
                      defaultValue={selected.alt_text ?? ""}
                      onBlur={(e) =>
                        void update({
                          data: { id: selected.id, patch: { alt_text: e.target.value } },
                        }).then(
                          () => invalidate(),
                          () => toast.error("Kunde inte spara alt-texten."),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="utm">UTM / CTA-länk</Label>
                    <Input
                      id="utm"
                      defaultValue={selected.utm ?? ""}
                      placeholder="https://parkkey.org/test?utm_source=linkedin"
                      onBlur={(e) =>
                        void update({
                          data: { id: selected.id, patch: { utm: e.target.value } },
                        }).then(
                          () => invalidate(),
                          () => toast.error("Kunde inte spara länken."),
                        )
                      }
                    />
                  </div>
                </div>

                <fieldset className="mt-5">
                  <legend className="text-sm font-semibold">Bifogat material</legend>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Endast material i mediabiblioteket kan bifogas. Godkänn materialet innan
                    kundnära publicering.
                  </p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(data?.assets ?? []).map((a) => {
                      const checked = attachedIds.includes(a.id);
                      return (
                        <li
                          key={a.id}
                          className="flex items-center gap-2 rounded-md border border-border p-2"
                        >
                          <Checkbox
                            id={`asset-${a.id}`}
                            checked={checked}
                            onCheckedChange={(value) => {
                              const next = value
                                ? [...attachedIds, a.id]
                                : attachedIds.filter((id) => id !== a.id);
                              void setAssets({ data: { id: selected.id, asset_ids: next } }).then(
                                () => invalidate(),
                                () => toast.error("Kunde inte uppdatera bilagor."),
                              );
                            }}
                          />
                          <Label htmlFor={`asset-${a.id}`} className="text-xs font-normal">
                            {a.name} · {a.kind} · {a.approval_status}
                          </Label>
                        </li>
                      );
                    })}
                    {(data?.assets ?? []).length === 0 ? (
                      <li className="text-xs text-muted-foreground">
                        Inget material i mediabiblioteket ännu.
                      </li>
                    ) : null}
                  </ul>
                </fieldset>

                <div className="mt-5 flex flex-wrap gap-2">
                  {selected.status === "DRAFT" ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        void setStatus({
                          data: { id: selected.id, status: "INTERNAL REVIEW" },
                        }).then(
                          () => invalidate(),
                          (err: unknown) =>
                            toast.error(err instanceof Error ? err.message : "Kunde inte ändra."),
                        )
                      }
                    >
                      Till intern granskning
                    </Button>
                  ) : null}
                  {selected.status === "REVIEW" || selected.status === "INTERNAL REVIEW" ? (
                    <Button
                      onClick={() =>
                        void setStatus({ data: { id: selected.id, status: "APPROVED" } }).then(
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
                    variant="ghost"
                    onClick={() =>
                      void duplicate({ data: { id: selected.id } }).then(
                        () => {
                          toast.success("Inlägget duplicerades som utkast.");
                          invalidate();
                        },
                        () => toast.error("Kunde inte duplicera."),
                      )
                    }
                  >
                    <Copy aria-hidden="true" />
                    Duplicera
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur-xl">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarClock aria-hidden="true" className="size-4 text-primary" />
                  Schemalägg
                </h3>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="when">Datum och tid</Label>
                    <Input
                      id="when"
                      type="datetime-local"
                      value={when}
                      onChange={(e) => setWhen(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tz">Tidszon</Label>
                    <Input
                      id="tz"
                      value={tz}
                      onChange={(e) => setTz(e.target.value)}
                      className="w-48"
                    />
                  </div>
                  <Button
                    disabled={
                      selected.status !== "APPROVED" && !selected.status.startsWith("SCHEDULED")
                    }
                    onClick={() => {
                      if (!when) {
                        toast.error("Välj datum och tid.");
                        return;
                      }
                      void schedule({
                        data: {
                          id: selected.id,
                          scheduled_at: new Date(when).toISOString(),
                          timezone: tz,
                        },
                      }).then(
                        (res) => {
                          toast.success(`Lagt i kö: ${res.status}`);
                          void capability.refetch();
                          invalidate();
                        },
                        (err: unknown) =>
                          toast.error(
                            err instanceof Error ? err.message : "Kunde inte schemalägga.",
                          ),
                      );
                    }}
                  >
                    Lägg i kö
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void publish({ data: { post_id: selected.id } }).then(
                        (res) => {
                          toast.message(res.message);
                          void capability.refetch();
                          invalidate();
                        },
                        (err: unknown) =>
                          toast.error(
                            err instanceof Error ? err.message : "Försöket misslyckades.",
                          ),
                      )
                    }
                  >
                    <Send aria-hidden="true" />
                    Verifiera publiceringsförsök
                  </Button>
                </div>
                {selected.status !== "APPROVED" && !selected.status.startsWith("SCHEDULED") ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Inlägget måste vara godkänt innan det kan schemaläggas.
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur-xl">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Linkedin aria-hidden="true" className="size-4 text-primary" />
                  Förhandsvisning
                </h3>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Desktop
                    </p>
                    <article className="rounded-lg border border-border bg-background/70 p-4">
                      <p className="text-sm font-semibold">ParkKey™</p>
                      <p className="text-xs text-muted-foreground">Förhandsvisning · intern</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm">{selected.copy_sv}</p>
                      <div className="mt-3 aspect-[1.91/1] rounded-md border border-dashed border-border bg-card/60 p-3 text-xs text-muted-foreground">
                        {attachedIds.length > 0
                          ? `${attachedIds.length} bifogad(e) fil(er)`
                          : "Ingen bild bifogad"}
                      </div>
                    </article>
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Mobil
                    </p>
                    <article className="mx-auto w-[300px] rounded-lg border border-border bg-background/70 p-3">
                      <p className="text-sm font-semibold">ParkKey™</p>
                      <p className="text-[11px] text-muted-foreground">Förhandsvisning · intern</p>
                      <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-[13px]">
                        {selected.copy_sv}
                      </p>
                      <div className="mt-2 aspect-square rounded-md border border-dashed border-border bg-card/60 p-2 text-[11px] text-muted-foreground">
                        {attachedIds.length > 0
                          ? `${attachedIds.length} bifogad(e) fil(er)`
                          : "Ingen bild bifogad"}
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
