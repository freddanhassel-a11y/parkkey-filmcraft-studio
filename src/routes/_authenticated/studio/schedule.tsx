import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { sv } from "date-fns/locale";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  List,
  RotateCcw,
  Send,
  X,
} from "lucide-react";

import { attemptPublish, cancelSchedule, listSocialPosts } from "@/lib/social.functions";
import {
  duplicateSocialPostForFormat,
  rescheduleSocialSchedule,
} from "@/lib/social-calendar.functions";
import { SectionHeading } from "@/components/studio/brand";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/studio/StatusBadge";

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

type ViewMode = "list" | "week" | "month";
type ScheduleRow = NonNullable<Awaited<ReturnType<typeof listSocialPosts>>>["schedules"][number];

function SchedulePage() {
  const qc = useQueryClient();
  const fetchPosts = useServerFn(listSocialPosts);
  const cancel = useServerFn(cancelSchedule);
  const publish = useServerFn(attemptPublish);
  const reschedule = useServerFn(rescheduleSocialSchedule);
  const duplicateFormat = useServerFn(duplicateSocialPostForFormat);
  const { data, isLoading, error } = useQuery({
    queryKey: ["social"],
    queryFn: () => fetchPosts(),
  });
  const [view, setView] = useState<ViewMode>("week");
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [draggedScheduleId, setDraggedScheduleId] = useState<string | null>(null);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["social"] });
  const postTitle = (id: string) => data?.posts.find((p) => p.id === id)?.title ?? "Okänt inlägg";

  const schedules = useMemo(
    () => (data?.schedules ?? []).filter((schedule) => schedule.status !== "CANCELLED"),
    [data?.schedules],
  );

  const visibleDays = useMemo(() => {
    if (view === "week") {
      return eachDayOfInterval({
        start: startOfWeek(cursorDate, { weekStartsOn: 1 }),
        end: endOfWeek(cursorDate, { weekStartsOn: 1 }),
      });
    }
    if (view === "month") {
      return eachDayOfInterval({
        start: startOfWeek(startOfMonth(cursorDate), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(cursorDate), { weekStartsOn: 1 }),
      });
    }
    return [];
  }, [cursorDate, view]);

  const periodLabel = useMemo(() => {
    if (view === "week") {
      const first = visibleDays[0];
      const last = visibleDays.at(-1);
      if (!first || !last) return "";
      return `${format(first, "d MMM", { locale: sv })} – ${format(last, "d MMM yyyy", { locale: sv })}`;
    }
    if (view === "month") return format(cursorDate, "MMMM yyyy", { locale: sv });
    return "";
  }, [cursorDate, view, visibleDays]);

  function movePeriod(direction: -1 | 1) {
    setCursorDate((current) => {
      if (view === "week") return direction === 1 ? addWeeks(current, 1) : subWeeks(current, 1);
      if (view === "month") return direction === 1 ? addMonths(current, 1) : subMonths(current, 1);
      return current;
    });
  }

  async function moveScheduleToDay(schedule: ScheduleRow, targetDay: Date) {
    const original = new Date(schedule.scheduled_at);
    const target = new Date(targetDay);
    target.setHours(original.getHours(), original.getMinutes(), original.getSeconds(), 0);
    try {
      const result = await reschedule({
        data: {
          schedule_id: schedule.id,
          scheduled_at: target.toISOString(),
          timezone: schedule.timezone,
        },
      });
      toast.success(
        result.status === "SCHEDULED"
          ? "Schemat flyttades."
          : "Schemat flyttades, men LinkedIn-anslutning krävs före publicering.",
      );
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte flytta schemat.");
    }
  }

  async function moveScheduleByDays(schedule: ScheduleRow, days: number) {
    await moveScheduleToDay(schedule, addDays(new Date(schedule.scheduled_at), days));
  }

  async function duplicateForFormat(postId: string, aspectRatio: string) {
    try {
      const row = await duplicateFormat({ data: { post_id: postId, aspect_ratio: aspectRatio } });
      toast.success(`${row.title} skapades som DRAFT.`);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte duplicera formatet.");
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Schema"
        title="Publiceringskö"
        description="Kön är intern. Status visar sanningsenligt om en verifierad anslutning saknas — inget markeras som publicerat utan verklig publicering."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
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
            variant={view === "week" ? "default" : "outline"}
            size="sm"
            aria-pressed={view === "week"}
            onClick={() => setView("week")}
          >
            <CalendarDays aria-hidden="true" />
            Vecka
          </Button>
          <Button
            variant={view === "month" ? "default" : "outline"}
            size="sm"
            aria-pressed={view === "month"}
            onClick={() => setView("month")}
          >
            <CalendarDays aria-hidden="true" />
            Månad
          </Button>
        </div>

        {view !== "list" ? (
          <div className="flex items-center gap-2" aria-label="Kalenderperiod">
            <Button size="icon" variant="outline" onClick={() => movePeriod(-1)} aria-label="Föregående">
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button variant="ghost" onClick={() => setCursorDate(new Date())}>
              {periodLabel}
            </Button>
            <Button size="icon" variant="outline" onClick={() => movePeriod(1)} aria-label="Nästa">
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        ) : null}
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
          {(data?.schedules ?? []).map((schedule) => (
            <li
              key={schedule.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-4"
            >
              <div>
                <p className="text-sm font-semibold">{postTitle(schedule.post_id)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(schedule.scheduled_at).toLocaleString("sv-SE")} · {schedule.timezone}
                </p>
                <div className="mt-2">
                  <StatusBadge status={schedule.status} />
                </div>
              </div>
              <ScheduleActions
                schedule={schedule}
                onPublish={async () => {
                  const result = await publish({
                    data: { post_id: schedule.post_id, schedule_id: schedule.id },
                  });
                  toast.message(result.message);
                  invalidate();
                }}
                onCancel={async () => {
                  await cancel({ data: { schedule_id: schedule.id, post_id: schedule.post_id } });
                  toast.success("Schemat avbrutet, inlägget är godkänt igen.");
                  invalidate();
                }}
                onMove={(days) => moveScheduleByDays(schedule, days)}
                onDuplicate={(formatValue) => duplicateForFormat(schedule.post_id, formatValue)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={
            view === "week"
              ? "grid gap-2 lg:grid-cols-7"
              : "grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
          }
        >
          {visibleDays.map((day) => {
            const daySchedules = schedules.filter((schedule) =>
              isSameDay(new Date(schedule.scheduled_at), day),
            );
            const muted = view === "month" && !isSameMonth(day, cursorDate);
            return (
              <section
                key={day.toISOString()}
                className={`min-h-36 rounded-xl border border-border p-2 transition-colors ${
                  muted ? "bg-card/25 opacity-60" : "bg-card/60"
                } ${draggedScheduleId ? "hover:border-primary/70 hover:bg-accent/40" : ""}`}
                onDragOver={(event) => {
                  if (draggedScheduleId) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const schedule = schedules.find((item) => item.id === draggedScheduleId);
                  setDraggedScheduleId(null);
                  if (schedule) void moveScheduleToDay(schedule, day);
                }}
              >
                <h2 className="flex items-center justify-between text-xs font-semibold">
                  <span>{format(day, "EEE", { locale: sv })}</span>
                  <span className="text-muted-foreground">{format(day, "d")}</span>
                </h2>
                <ul className="mt-2 space-y-2">
                  {daySchedules.map((schedule) => (
                    <li
                      key={schedule.id}
                      draggable
                      onDragStart={() => setDraggedScheduleId(schedule.id)}
                      onDragEnd={() => setDraggedScheduleId(null)}
                      className="cursor-grab rounded-lg border border-border bg-background/70 p-2 active:cursor-grabbing"
                    >
                      <p className="text-[11px] font-semibold text-primary">
                        {format(new Date(schedule.scheduled_at), "HH:mm")}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs font-medium">
                        {postTitle(schedule.post_id)}
                      </p>
                      <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">
                        {schedule.status}
                      </p>
                      <div className="mt-2 flex gap-1">
                        <button
                          type="button"
                          className="rounded border border-border px-1.5 py-0.5 text-[10px] hover:bg-accent"
                          onClick={() => void moveScheduleByDays(schedule, -1)}
                          aria-label={`Flytta ${postTitle(schedule.post_id)} en dag bakåt`}
                        >
                          −1d
                        </button>
                        <button
                          type="button"
                          className="rounded border border-border px-1.5 py-0.5 text-[10px] hover:bg-accent"
                          onClick={() => void moveScheduleByDays(schedule, 1)}
                          aria-label={`Flytta ${postTitle(schedule.post_id)} en dag framåt`}
                        >
                          +1d
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <section aria-label="Försökslogg" className="space-y-3">
        <h2 className="text-lg font-semibold">Försökslogg</h2>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card/60">
          {(data?.attempts ?? []).slice(0, 25).map((attempt) => (
            <li key={attempt.id} className="p-3 text-xs">
              <p className="font-medium">
                {postTitle(attempt.post_id)} · {attempt.status}
              </p>
              <p className="text-muted-foreground">
                {new Date(attempt.created_at).toLocaleString("sv-SE")}
                {attempt.error_message ? ` — ${attempt.error_message}` : ""}
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

function ScheduleActions({
  schedule,
  onPublish,
  onCancel,
  onMove,
  onDuplicate,
}: {
  schedule: ScheduleRow;
  onPublish: () => Promise<void>;
  onCancel: () => Promise<void>;
  onMove: (days: number) => Promise<void>;
  onDuplicate: (aspectRatio: string) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          void onPublish().catch((err: unknown) =>
            toast.error(err instanceof Error ? err.message : "Försöket misslyckades."),
          )
        }
      >
        <Send aria-hidden="true" />
        Kör försök
      </Button>
      {schedule.status !== "CANCELLED" ? (
        <>
          <Button size="sm" variant="ghost" onClick={() => void onMove(1)}>
            <RotateCcw aria-hidden="true" />
            +1 dag
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              void onCancel().catch(() => toast.error("Kunde inte avbryta schemat."))
            }
          >
            <X aria-hidden="true" />
            Avbryt
          </Button>
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent">
              <Copy aria-hidden="true" className="size-3.5" />
              Duplicera format
            </summary>
            <div className="absolute right-0 z-10 mt-1 flex min-w-40 flex-col gap-1 rounded-lg border border-border bg-popover p-2 shadow-xl">
              {["1:1", "4:5", "16:9", "9:16"].map((aspectRatio) => (
                <button
                  key={aspectRatio}
                  type="button"
                  className="rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
                  onClick={() => void onDuplicate(aspectRatio)}
                >
                  {aspectRatio}
                </button>
              ))}
            </div>
          </details>
        </>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <RotateCcw aria-hidden="true" className="size-3" />
          Schemalägg om i LinkedIn Studio
        </span>
      )}
    </div>
  );
}
