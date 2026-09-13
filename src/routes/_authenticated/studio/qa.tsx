import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, ShieldCheck } from "lucide-react";

import {
  ACTIVE_PARKKEY_SKILLS,
  EXPORT_PRESETS,
  GLOBAL_NEGATIVE_LIST,
  MESSAGE_BANK,
  QA_GATE_ITEMS,
} from "@/lib/parkkey-rules";
import { getReleaseProof, type ReleaseProofState } from "@/lib/release-proof.functions";
import { SectionHeading } from "@/components/studio/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/studio/qa")({
  head: () => ({
    meta: [
      { title: "Skills & QA — ParkKey™ Film Studio" },
      {
        name: "description",
        content:
          "Aktiva ParkKey-skills, autentiserad release proof, QA-grind, exportpresets och sanningsregler för Film Studio.",
      },
      { property: "og:title", content: "Skills & QA — ParkKey™ Film Studio" },
      {
        property: "og:description",
        content: "Regler och verifierbara releasebevis för ParkKey-produktioner.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QaPage,
});

function QaPage() {
  const fetchReleaseProof = useServerFn(getReleaseProof);
  const release = useQuery({
    queryKey: ["release-proof"],
    queryFn: () => fetchReleaseProof(),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Skills & QA"
        title="Release proof och ParkKey-regler"
        description="Automatiska kontroller får bara PASS när den autentiserade servergränsen kan bevisa dem. Browser-, mottagar- och externa providerflöden ligger kvar som MANUAL tills de körts på riktigt."
      >
        <Button
          variant="secondary"
          onClick={() => void release.refetch()}
          disabled={release.isFetching}
        >
          <RefreshCw aria-hidden="true" className={release.isFetching ? "animate-spin" : ""} />
          Kör om verifiering
        </Button>
      </SectionHeading>

      <section className="space-y-4" aria-label="Release proof">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Release proof matrix
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Read-only diagnostik. Ingen kundkontakt, publicering eller rendering startas av denna
              kontroll.
            </p>
          </div>
          {release.data ? (
            <div className="flex flex-wrap gap-2 text-xs">
              <SummaryChip label="PASS" value={release.data.summary.pass} state="PASS" />
              <SummaryChip label="FAIL" value={release.data.summary.fail} state="FAIL" />
              <SummaryChip label="MANUAL" value={release.data.summary.manual} state="MANUAL" />
            </div>
          ) : null}
        </div>

        {release.isLoading ? (
          <p className="surface-glass rounded-xl p-6 text-sm text-muted-foreground" role="status">
            Kör autentiserade releasekontroller…
          </p>
        ) : release.error ? (
          <div className="rounded-xl border border-status-error/50 bg-card/70 p-5">
            <p className="text-sm font-semibold text-status-error">Release proof kunde inte köras</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {release.error instanceof Error ? release.error.message : "Okänt fel"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {(release.data?.items ?? []).map((proof) => (
              <article key={proof.id} className="surface-glass rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      {proof.area}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-foreground">{proof.label}</h3>
                  </div>
                  <ProofBadge state={proof.state} />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {proof.evidence}
                </p>
              </article>
            ))}
          </div>
        )}

        {release.data ? (
          <p className="text-xs text-muted-foreground">
            Senast kontrollerad {new Date(release.data.checkedAt).toLocaleString("sv-SE")} ·{" "}
            {release.data.summary.total} kontroller. MANUAL betyder inte fel — det betyder att
            verklig browser/användare/provider måste bevisa steget.
          </p>
        ) : null}
      </section>

      <section className="space-y-4" aria-label="Aktiva skills">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          Aktiva skills
        </h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {ACTIVE_PARKKEY_SKILLS.map((skill) => (
            <li key={skill.name} className="surface-glass rounded-xl p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
                <p className="font-mono text-sm font-semibold text-foreground">{skill.name}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{skill.governs}</p>
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
            {EXPORT_PRESETS.map((preset) => (
              <li key={preset.id}>
                {preset.label} — {preset.resolution}, 30 fps, H.264 MP4-master
              </li>
            ))}
          </ul>
        </div>
        <div className="surface-glass rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Budskapsbank
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {MESSAGE_BANK.map((message) => (
              <li key={message}>{message}</li>
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
            {QA_GATE_ITEMS.map((qaItem) => (
              <li key={qaItem.id}>{qaItem.label}</li>
            ))}
          </ul>
        </div>
        <div className="surface-glass rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Global negativlista
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {GLOBAL_NEGATIVE_LIST.map((negative) => (
              <li key={negative}>{negative}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function ProofBadge({ state }: { state: ReleaseProofState }) {
  const className =
    state === "PASS"
      ? "border-status-verified/40 text-status-verified"
      : state === "FAIL"
        ? "border-status-error/40 text-status-error"
        : "border-status-unknown/40 text-status-unknown";
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${className}`}
    >
      {state}
    </span>
  );
}

function SummaryChip({
  label,
  value,
  state,
}: {
  label: string;
  value: number;
  state: ReleaseProofState;
}) {
  return (
    <span className="rounded-full border border-border bg-card/70 px-3 py-1.5">
      <span className="font-semibold">{label}</span> {value}
      <span className="sr-only"> status {state}</span>
    </span>
  );
}
