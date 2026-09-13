import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, List, RotateCcw, Send, X } from "lucide-react";

import { attemptPublish, cancelSchedule, listSocialPosts } from "@/lib/social.functions";
import { SectionHeading } from "@/components/studio/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/studio/schedule")({
  head: () => ({
    meta: [
      { title: "Schema — ParkKey™ Film Studio" },
      {
        name: "description",
        content:
          "Intern publiceringskö för ParkKey-inlägg med tidszon, sanningsenlig status, försökslogg och omschemaläggning.",
      },
      { property: "og:title", content: "Schema — ParkKey™ Film Studio" },
      {
        property: "og:description",
        content: "Publiceringskö med truthful status och full försökshistorik.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const qc = useQueryClient();
  const fetchPosts = useServerFn(listSocialPosts);
  const cancel = useServerFn(cancelSchedule);
  const publish = useServerFn(attemptPublish);
  const { data, isLoading, error } = useQuery({
    queryKey: ["social"],
    queryFn: () => fetchPosts(),
  });
  const [view, setView] = useState<"list" | "calendar">("list");

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["social"] });
  const postTitle = (id: string) => data?.posts.find((p) => p.id === id)?.title ?? "Okänt inlägg";

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      typeof data extends undefined ? never : NonNullable<typeof data>["schedules"]
    >();
    for (const s of data?.schedules ?? []) {
      const day = new Date(s.scheduled_at).toISOString().slice(0, 10);
      const list = map.get(day) ?? [];
      list.push(s);
      map.set(day, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Schema"
        title="Publiceringskö"
        description="Kön är intern. Status visar sanningsenligt om en verifierad anslutning saknas — inget markeras som publicerat utan verklig publicering."
      />

      <div className="flex gap-2" role="group" aria-label="Vy">
        <Button
          variant={view === "list" ? "default" : "outline"}
          size="sm"
          aria-pressed={view === "list"}
          onClick={() => setView("list")}
        >
          <List aria-hidden="true" />
          Lista
        </Button>
        <Button
          variant={view === "calendar" ? "default" : "outline"}
          size="sm"
          aria-pressed={view === "calendar"}
          onClick={() => setView("calendar")}
        >
          <CalendarDays aria-hidden="true" />
          Kalender
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Hämtar kön…
        </p>
      ) : error ? (
        <p className="text-sm text-status-error">
          Kunde inte hämta kön: {error instanceof Error ? error.message : "okänt fel"}
        </p>
      ) : (data?.schedules ?? []).length === 0 ? (
        <p className="rounded-xl border border-border bg-card/60 p-6 text-sm text-muted-foreground">
          Inget är schemalagt. Godkänn ett inlägg i LinkedIn Studio och lägg det i kö.
        </p>
      ) : view === "list" ? (
        <ul className="space-y-3">
          {(data?.schedules ?? []).map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-4"
            >
              <div>
                <p className="text-sm font-semibold">{postTitle(s.post_id)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.scheduled_at).toLocaleString("sv-SE")} · {s.timezone}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-status-unknown">
                  {s.status}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void publish({ data: { post_id: s.post_id, schedule_id: s.id } }).then(
                      (res) => {
                        toast.message(res.message);
                        invalidate();
                      },
                      (err: unknown) =>
                        toast.error(err instanceof Error ? err.message : "Försöket misslyckades."),
                    )
                  }
                >
                  <Send aria-hidden="true" />
                  Kör försök
                </Button>
                {s.status !== "CANCELLED" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void cancel({ data: { schedule_id: s.id, post_id: s.post_id } }).then(
                        () => {
                          toast.success("Schemat avbrutet, inlägget är godkänt igen.");
                          invalidate();
                        },
                        () => toast.error("Kunde inte avbryta."),
                      )
                    }
                  >
                    <X aria-hidden="true" />
                    Avbryt
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <RotateCcw aria-hidden="true" className="size-3" />
                    Schemalägg om i LinkedIn Studio
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, items]) => (
            <section key={day} className="rounded-xl border border-border bg-card/60 p-4">
              <h2 className="text-sm font-semibold">
                {new Date(day).toLocaleDateString("sv-SE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h2>
              <ul className="mt-3 space-y-2">
                {items.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-border bg-background/50 p-3 text-sm"
                  >
                    <span className="font-medium">
                      {new Date(s.scheduled_at).toLocaleTimeString("sv-SE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>{" "}
                    {postTitle(s.post_id)}
                    <span className="mt-1 block text-xs text-status-unknown">{s.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <section aria-label="Försökslogg" className="space-y-3">
        <h2 className="text-lg font-semibold">Försökslogg</h2>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card/60">
          {(data?.attempts ?? []).slice(0, 25).map((a) => (
            <li key={a.id} className="p-3 text-xs">
              <p className="font-medium">
                {postTitle(a.post_id)} · {a.status}
              </p>
              <p className="text-muted-foreground">
                {new Date(a.created_at).toLocaleString("sv-SE")}
                {a.error_message ? ` — ${a.error_message}` : ""}
              </p>
            </li>
          ))}
          {(data?.attempts ?? []).length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">Inga försök loggade ännu.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
