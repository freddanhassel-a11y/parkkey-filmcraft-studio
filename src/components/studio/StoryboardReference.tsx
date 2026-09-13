import { ImageIcon, Lock } from "lucide-react";
import {
  STORYBOARD_ASSET_NAME,
  STORYBOARD_ASSET_URL,
  STORYBOARD_FRAMES,
  STORYBOARD_LOOK,
} from "@/lib/storyboard-reference";

/** Shows that the uploaded storyboard is the active canonical reference for a film. */
export function StoryboardReference({ posterUrl }: { posterUrl?: string | null }) {
  const src = posterUrl && posterUrl.length > 0 ? posterUrl : STORYBOARD_ASSET_URL;
  return (
    <section aria-labelledby="storyboard-ref" className="surface-glass rounded-2xl p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          <Lock aria-hidden="true" className="size-3.5" />
          Aktiv visuell referens
        </span>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          Promptpaketet är genererat från denna storyboard
        </span>
      </div>
      <h2 id="storyboard-ref" className="mt-3 text-xl font-bold text-foreground">
        {STORYBOARD_ASSET_NAME}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        9 rutor, 0:00–0:35. Ljus, färg, miljö, Parkys kanoniska design och scenlogik är låsta mot
        denna bild. Enda medvetna avvikelsen: referensen visar laptop — filmen spelas mobil-först.
      </p>

      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="mt-5 block overflow-hidden rounded-xl border border-border focus-visible:outline-none"
      >
        <img
          src={src}
          alt="Storyboard för Parky-testet: nio rutor i solig nordisk höststad med Parky som guide och ParkKey-slutbild med CTA ParkKey.org/test"
          className="w-full"
          loading="lazy"
          width={1672}
          height={941}
        />
      </a>

      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        {(
          [
            ["Ljus", STORYBOARD_LOOK.light],
            ["Palett", STORYBOARD_LOOK.palette],
            ["Miljö", STORYBOARD_LOOK.environment],
            ["Kamera och optik", STORYBOARD_LOOK.camera],
            ["Tonalitet", STORYBOARD_LOOK.tonality],
            ["Parky kanonisk design", STORYBOARD_LOOK.parky],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-[0.14em] text-primary">{label}</dt>
            <dd className="mt-1 text-muted-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-6 flex items-center gap-2 text-sm font-semibold text-foreground">
        <ImageIcon aria-hidden="true" className="size-4 text-primary" />
        Scenlogik låst från referensen (mobil-först regi)
      </h3>
      <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
        {STORYBOARD_FRAMES.map((f) => (
          <li key={f.index} className="rounded-lg border border-border/60 p-3">
            <span className="font-semibold text-foreground">
              Ruta {f.index} · {f.start}–{f.end}s
            </span>
            <span className="mt-1 block">{f.mobileFirst}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
