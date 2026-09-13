import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Film, ListChecks, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StudioWordmark } from "@/components/studio/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ParkKey™ Film Studio — produktion av ParkKey-reklamfilm" },
      {
        name: "description",
        content:
          "Studion där ParkKey™-reklamfilmer planeras, promptas, versionshanteras, QA-granskas och exporteras enligt ParkKeys egna regler.",
      },
      { property: "og:title", content: "ParkKey™ Film Studio" },
      {
        property: "og:description",
        content:
          "Brief, promptmotor, filmbibliotek, kontinuitet, QA-grind och exportpresets för ParkKey-kampanjfilm.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  return (
    <main className="surface-cinematic min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <StudioWordmark className="text-base" />
        <Button asChild variant="secondary" size="sm">
          <Link to={signedIn ? "/studio" : "/auth"}>{signedIn ? "Öppna studion" : "Logga in"}</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10 sm:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Intern produktionsstudio
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] text-foreground sm:text-6xl">
          Reklamfilm som känns <span className="text-gradient-park">ParkKey</span> — varje ruta,
          varje beat.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Planera kampanjfilmen, låt studion väva in ParkKeys egna regler i masterprompt, storyboard
          och kontinuitetsbibel — och släpp inget vidare förrän QA-grinden är passerad.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to={signedIn ? "/studio" : "/auth"}>
              {signedIn ? "Till dashboarden" : "Logga in i studion"}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <dl className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Sparkles,
              term: "Promptmotor",
              desc: "Brief in — masterprompt, storyboard, shot list, kontinuitet, musik och negativlista ut.",
            },
            {
              icon: Film,
              term: "Filmbibliotek",
              desc: "Versioner, ändringslogg, format och sanna nedladdningstillstånd per render.",
            },
            {
              icon: ListChecks,
              term: "QA-grind",
              desc: "Logotyp, kanonisk Parky, verklig UI-text, rörelse, ljudreglage och säkra marginaler.",
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
          ParkKey™ är systemet. Parky™ ger belöningen. CoreOS™ bevisar effekten.
        </p>
      </section>
    </main>
  );
}
