import { cn } from "@/lib/utils";

/**
 * Typographic CoreOS lockup for the Studio module.
 * Deliberately typographic: the official ParkKey™ logo file is an uploaded brand
 * asset and must never be reconstructed or invented in code.
 */
export function StudioWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-baseline gap-2 font-semibold tracking-tight", className)}>
      <span className="text-foreground">
        CORE<span className="text-primary">OS</span>
        <span className="align-super text-[0.6em]">™</span>
      </span>
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
        Studio
      </span>
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
