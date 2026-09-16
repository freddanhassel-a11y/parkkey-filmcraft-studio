import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart3,
  Boxes,
  CalendarClock,
  Clapperboard,
  Handshake,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LibraryBig,
  Linkedin,
  LogOut,
  PackageCheck,
  Plug,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useParkkeySession } from "@/lib/parkkey-session";
import { ensureLinkedInAutumnSeries2026Fn } from "@/lib/linkedin-autumn-series.functions";
import { Button } from "@/components/ui/button";
import { StudioWordmark } from "@/components/studio/brand";

export const Route = createFileRoute("/_authenticated/studio")({
  component: StudioLayout,
});

const NAV = [
  { to: "/studio", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/studio/intake", label: "Visuell inkorg", icon: Inbox, exact: false },
  { to: "/studio/library", label: "Filmer", icon: Clapperboard, exact: false },
  { to: "/studio/new", label: "Ny film", icon: Plus, exact: false },
  { to: "/studio/social", label: "Social Creative", icon: ImageIcon, exact: false },
  { to: "/studio/linkedin", label: "LinkedIn", icon: Linkedin, exact: false },
  { to: "/studio/linkedin-history", label: "LinkedIn History", icon: BarChart3, exact: false },
  { to: "/studio/media", label: "Mediabibliotek", icon: Boxes, exact: false },
  { to: "/studio/customers", label: "Kundmaterial", icon: Handshake, exact: false },
  { to: "/studio/assets", label: "Leveranser", icon: PackageCheck, exact: false },
  { to: "/studio/schedule", label: "Schema", icon: CalendarClock, exact: false },
  { to: "/studio/prompts", label: "Promptbibliotek", icon: Sparkles, exact: false },
  { to: "/studio/integrations", label: "Integrationer", icon: Plug, exact: false },
  { to: "/studio/qa", label: "Skills & QA", icon: ShieldCheck, exact: false },
  { to: "/studio/settings", label: "Inställningar", icon: Settings, exact: false },
] as const;

function StudioLayout() {
  const navigate = useNavigate();
  const { user, signOut } = useParkkeySession();
  const ensureAutumnSeries = useServerFn(ensureLinkedInAutumnSeries2026Fn);

  useEffect(() => {
    if (!user?.id) return;
    void ensureAutumnSeries().catch((error: unknown) => {
      console.error("Could not materialize LinkedIn autumn series", error);
    });
  }, [ensureAutumnSeries, user?.id]);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="surface-cinematic min-h-screen">
      <a
        href="#studio-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Hoppa till innehåll
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/studio" className="mr-2 rounded-md" aria-label="CoreOS Studio">
            <StudioWordmark className="text-sm" />
          </Link>
          <div className="ml-auto order-2 flex items-center gap-3">
            {user?.email ? (
              <span className="hidden text-xs text-muted-foreground md:inline">
                {user.email} · CoreOS-konto
              </span>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => void handleSignOut()}>
              <LogOut aria-hidden="true" />
              Logga ut
            </Button>
          </div>
          <nav aria-label="CoreOS Studio-navigering" className="order-3 w-full">
            <ul className="flex flex-wrap gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    activeOptions={{ exact: item.exact }}
                    activeProps={{
                      className:
                        "bg-accent text-accent-foreground border-primary/40 border-b-2 border-b-primary",
                    }}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <item.icon aria-hidden="true" className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="studio-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted-foreground sm:px-6">
        <p className="flex items-center gap-2">
          <LibraryBig aria-hidden="true" className="size-3.5" />
          CoreOS Studio använder samma ParkKey-regler, identitet, kunder och materialdata som övriga
          CoreOS.
        </p>
      </footer>
    </div>
  );
}
