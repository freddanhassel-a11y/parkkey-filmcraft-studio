import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import {
  ACTIVE_PARKKEY_SKILLS,
  EXPORT_PRESETS,
  GLOBAL_NEGATIVE_LIST,
  MESSAGE_BANK,
  QA_GATE_ITEMS,
} from "@/lib/parkkey-rules";
import { SectionHeading } from "@/components/studio/brand";

export const Route = createFileRoute("/_authenticated/studio/qa")({
  head: () => ({
    meta: [
      { title: "Skills & QA — ParkKey™ Film Studio" },
      {
        name: "description",
        content:
          "Aktiva ParkKey-skills, QA-grind, global negativlista, exportpresets och budskapsbank som styr varje filmprojekt och socialt paket.",
      },
      { property: "og:title", content: "Skills & QA — ParkKey™ Film Studio" },
      {
        property: "og:description",
        content: "Reglerna som varje ParkKey-produktion ärver automatiskt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QaPage,
});

function QaPage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Skills & QA"
        title="Vilka ParkKey-regler som styr studion"
        description="Varje nytt filmprojekt och socialt paket ärver dessa regler automatiskt i masterprompt, storyboard, kontinuitetsbibel, kreativa paket och QA-grind."
      />

      <section className="space-y-4" aria-label="Aktiva skills">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          Aktiva skills
        </h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {ACTIVE_PARKKEY_SKILLS.map((s) => (
            <li key={s.name} className="surface-glass rounded-xl p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
                <p className="font-mono text-sm font-semibold text-foreground">{s.name}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.governs}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-glass rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Exportpresets
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {EXPORT_PRESETS.map((p) => (
              <li key={p.id}>
                {p.label} — {p.resolution}, 30 fps, H.264 MP4-master
              </li>
            ))}
          </ul>
        </div>
        <div className="surface-glass rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Budskapsbank
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {MESSAGE_BANK.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-glass rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            QA-grind ({QA_GATE_ITEMS.length} punkter)
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {QA_GATE_ITEMS.map((i) => (
              <li key={i.id}>{i.label}</li>
            ))}
          </ul>
        </div>
        <div className="surface-glass rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Global negativlista
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {GLOBAL_NEGATIVE_LIST.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
