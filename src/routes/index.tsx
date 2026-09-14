import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Film, ListChecks, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudioWordmark } from "@/components/studio/brand";

const COREOS_FILM_STUDIO_URL = "https://parkkey-coreos.lovable.app/film-studio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ParkKey™ Film Studio — via CoreOS™" },
      {
        name: "description",
        content:
          "ParkKey™ Film Studio öppnas från CoreOS™ så kundkontext, behörighet, material och uppföljning hålls i samma operativa sanning.",
      },
      { property: "og:title", content: "ParkKey™ Film Studio — via CoreOS™" },
      {
        property: "og:description",
        content:
          "Starta Film Studio från CoreOS™ — ett kundregister, ett mediabibliotek och samma ParkKey-identitet.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="surface-cinematic min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <StudioWordmark className="text-base" />
        <Button asChild variant="secondary" size="sm">
          <a href={COREOS_FILM_STUDIO_URL}>Öppna via CoreOS</a>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10 sm:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Intern produktionsstudio · CoreOS är ingången
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] text-foreground sm:text-6xl">
          Reklamfilm som känns <span className="text-gradient-park">ParkKey</span> — med CoreOS som
          nav.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Film Studio och CoreOS använder samma ParkKey-identitet och samma backend. Starta arbetet i
          CoreOS för att behålla kundkontext, brief, material, sanningsstatus och uppföljning i ett
          sammanhängande flöde.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={COREOS_FILM_STUDIO_URL}>
              Gå till Film Studio via CoreOS
              <ArrowRight aria-hidden="true" />
            </a>
          </Button>
        </div>

        <dl className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Sparkles,
              term: "Brief från CoreOS",
              desc: "Starta med rätt kund och mål — sedan följer kontexten med in i Film Studio.",
            },
            {
              icon: Film,
              term: "Ett mediabibliotek",
              desc: "Film Studio och CoreOS visar samma media_assets och film_projects utan parallella kopior.",
            },
            {
              icon: ListChecks,
              term: "QA och publicering",
              desc: "QA, godkännande och externa publiceringsgrindar finns kvar innan något lämnar ParkKey.",
            },
          ].map((item) => (
            <div key={item.term} className="surface-glass rounded-xl p-5">
              <item.icon aria-hidden="true" className="size-5 text-primary" />
              <dt className="mt-3 font-semibold text-foreground">{item.term}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-14 text-sm text-muted-foreground">
          ParkKey™ är systemet. Parky™ ger belöningen. CoreOS™ är den operativa sanningen.
        </p>
      </section>
    </main>
  );
}
