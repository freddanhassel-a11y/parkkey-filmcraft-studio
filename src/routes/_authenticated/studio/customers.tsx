import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Link2, Search, Send, ShieldCheck, Upload } from "lucide-react";

import {
  exportMaterialToCoreos,
  getCoreosContext,
  linkCustomerMaterial,
  listMaterialLinks,
  searchCoreos,
  type CoreosEntity,
  type CoreosRecord,
} from "@/lib/coreos.functions";
import {
  confirmDeliveryPackage,
  createDeliveryPackage,
  listAuditEvents,
  listDeliveryPackages,
} from "@/lib/delivery.functions";
import { SectionHeading } from "@/components/studio/brand";
import { TruthBadge } from "@/components/studio/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/studio/customers")({
  head: () => ({
    meta: [
      { title: "Kundmaterial — ParkKey™ Film Studio" },
      {
        name: "description",
        content:
          "ParkKey Material Hub: koppla film- och mediematerial till CoreOS-poster, skriv tillbaka bevis och förbered kundleveranser med spårlogg.",
      },
      { property: "og:title", content: "Kundmaterial — ParkKey™ Film Studio" },
      {
        property: "og:description",
        content: "Säker brygga mellan Film Studio och CoreOS för kundmaterial och leveranser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomersPage,
});

const TYPE_LABEL: Record<string, string> = {
  municipality: "Kommun",
  operator: "Operatör",
  contact: "Kontakt",
  pilot: "Pilot",
};

function CustomersPage() {
  const qc = useQueryClient();
  const search = useServerFn(searchCoreos);
  const getContext = useServerFn(getCoreosContext);
  const linkMaterial = useServerFn(linkCustomerMaterial);
  const exportMaterial = useServerFn(exportMaterialToCoreos);
  const createPackage = useServerFn(createDeliveryPackage);
  const confirmPackage = useServerFn(confirmDeliveryPackage);
  const fetchLinks = useServerFn(listMaterialLinks);
  const fetchPackages = useServerFn(listDeliveryPackages);
  const fetchAudit = useServerFn(listAuditEvents);

  const links = useQuery({ queryKey: ["material-links"], queryFn: () => fetchLinks() });
  const packages = useQuery({ queryKey: ["delivery"], queryFn: () => fetchPackages() });
  const audit = useQuery({ queryKey: ["audit"], queryFn: () => fetchAudit() });

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<CoreosEntity[]>([]);
  const [denied, setDenied] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CoreosEntity | null>(null);
  const [record, setRecord] = useState<CoreosRecord | null>(null);
  const [contacts, setContacts] = useState<
    Array<{ id: string; full_name: string | null; email: string | null }>
  >([]);

  const [material, setMaterial] = useState({
    film_project_id: "",
    media_asset_id: "",
    truth_label: "DEMO",
    summary: "",
    preview_reference: "",
    notes: "",
  });

  const [pkg, setPkg] = useState({
    title: "",
    subject: "",
    message: "",
    truth_label: "APPROVED",
    film_project_id: "",
    media_asset_id: "",
    expires_at: "",
    recipient_name: "",
    recipient_email: "",
  });

  const projects = links.data?.projects ?? [];
  const assets = links.data?.assets ?? [];

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["material-links"] });
    void qc.invalidateQueries({ queryKey: ["delivery"] });
    void qc.invalidateQueries({ queryKey: ["audit"] });
  };

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    try {
      const res = await search({ data: { term } });
      setResults(res.results);
      setDenied(res.denied);
      if (res.results.length === 0) toast.message("Inga träffar i CoreOS.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sökningen misslyckades.");
    } finally {
      setSearching(false);
    }
  }

  async function pick(entity: CoreosEntity) {
    setSelected(entity);
    setRecord(null);
    setContacts([]);
    try {
      const res = await getContext({ data: { type: entity.type, id: entity.id } });
      setRecord(res.record);
      setContacts(res.contacts);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte hämta kundkontext.");
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Material Hub"
        title="Kundmaterial"
        description="Sök upp en CoreOS-post, hämta känd kundkontext genom en smal serverkanal, koppla material och skriv tillbaka bevis. Inget skickas externt utan uttrycklig bekräftelse."
      />

      <div
        className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4 text-sm"
        role="note"
      >
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 text-primary" />
        <p>
          All CoreOS-läsning sker med din egen inloggning på serversidan, så CoreOS behörigheter
          gäller. Studion lagrar inget eget kundregister — bara referenser och sanningsstatus.
        </p>
      </div>

      <section aria-label="Sök i CoreOS" className="space-y-4">
        <form onSubmit={runSearch} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1 space-y-1.5">
            <Label htmlFor="term">Sök kommun, operatör, kontakt eller pilot</Label>
            <Input
              id="term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="t.ex. Uppsala"
            />
          </div>
          <Button type="submit" disabled={searching}>
            <Search aria-hidden="true" />
            {searching ? "Söker…" : "Sök i CoreOS"}
          </Button>
        </form>

        {denied.length > 0 ? (
          <p className="text-xs text-status-unknown">
            CoreOS nekade läsning av: {denied.join(", ")}. Det betyder att din behörighet inte
            täcker dem — inget antas.
          </p>
        ) : null}

        {results.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {results.map((r) => (
              <li key={`${r.type}-${r.id}`}>
                <button
                  type="button"
                  onClick={() => void pick(r)}
                  aria-current={selected?.id === r.id}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selected?.id === r.id
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card/60 hover:bg-accent/50"
                  }`}
                >
                  <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {TYPE_LABEL[r.type]}
                  </span>
                  <span className="mt-1 block text-sm font-semibold">{r.label}</span>
                  {r.sublabel ? (
                    <span className="block text-xs text-muted-foreground">{r.sublabel}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {selected && record ? (
        <section
          aria-label="Kundkontext"
          className="space-y-6 rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-xl"
        >
          <div>
            <h2 className="text-lg font-semibold">{selected.label}</h2>
            <p className="text-xs text-muted-foreground">
              {TYPE_LABEL[selected.type]} · CoreOS-ID {selected.id}
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(record).map(([key, value]) => (
                <div key={key} className="rounded-lg border border-border bg-background/50 p-3">
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {key}
                  </dt>
                  <dd className="mt-1 text-sm">
                    {value === null || value === ""
                      ? "Okänt"
                      : Array.isArray(value)
                        ? value.join(", ")
                        : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
            {contacts.length > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Kända kontakter: {contacts.map((c) => c.full_name ?? c.email).join(", ")}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="proj">Filmprojekt</Label>
              <Select
                value={material.film_project_id || "none"}
                onValueChange={(v) =>
                  setMaterial({ ...material, film_project_id: v === "none" ? "" : v })
                }
              >
                <SelectTrigger id="proj">
                  <SelectValue placeholder="Välj projekt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Inget projekt</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset">Mediematerial</Label>
              <Select
                value={material.media_asset_id || "none"}
                onValueChange={(v) =>
                  setMaterial({ ...material, media_asset_id: v === "none" ? "" : v })
                }
              >
                <SelectTrigger id="asset">
                  <SelectValue placeholder="Välj fil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen fil</SelectItem>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.approval_status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="truth">Sanningsstatus</Label>
              <Select
                value={material.truth_label}
                onValueChange={(v) => setMaterial({ ...material, truth_label: v })}
              >
                <SelectTrigger id="truth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["DEMO", "PROPOSED", "APPROVED", "EXPORTED"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preview">Intern förhandsvisningsreferens</Label>
              <Input
                id="preview"
                value={material.preview_reference}
                onChange={(e) => setMaterial({ ...material, preview_reference: e.target.value })}
                placeholder="Internt referens-ID eller sökväg"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="summary">Sammanfattning som skrivs till CoreOS</Label>
              <Textarea
                id="summary"
                value={material.summary}
                onChange={(e) => setMaterial({ ...material, summary: e.target.value })}
                placeholder="Kort beskrivning av materialet och dess status"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                void linkMaterial({
                  data: {
                    coreos_type: selected.type,
                    coreos_id: selected.id,
                    coreos_label: selected.label,
                    film_project_id: material.film_project_id || null,
                    media_asset_id: material.media_asset_id || null,
                    context_snapshot: record,
                    notes: material.notes || null,
                  },
                }).then(
                  () => {
                    toast.success("Materialet är kopplat till CoreOS-posten.");
                    invalidate();
                  },
                  (err: unknown) =>
                    toast.error(err instanceof Error ? err.message : "Kopplingen misslyckades."),
                )
              }
            >
              <Link2 aria-hidden="true" />
              Koppla material
            </Button>
            <Button
              onClick={() => {
                if (!material.summary.trim()) {
                  toast.error("Skriv en sammanfattning först.");
                  return;
                }
                void exportMaterial({
                  data: {
                    coreos_type: selected.type,
                    coreos_id: selected.id,
                    coreos_label: selected.label,
                    film_project_id: material.film_project_id || null,
                    media_asset_id: material.media_asset_id || null,
                    truth_label: material.truth_label,
                    summary: material.summary,
                    preview_reference: material.preview_reference || null,
                  },
                }).then(
                  (res) => {
                    toast.message(res.message);
                    invalidate();
                  },
                  (err: unknown) =>
                    toast.error(err instanceof Error ? err.message : "Skrivningen misslyckades."),
                );
              }}
            >
              <Upload aria-hidden="true" />
              Skriv tillbaka till CoreOS
            </Button>
          </div>
        </section>
      ) : null}

      <section aria-label="Kundleverans" className="space-y-4">
        <h2 className="text-lg font-semibold">Kundleverans</h2>
        <p className="text-sm text-muted-foreground">
          Endast APPROVED eller EXPORTED material kan paketeras. Utskicket sker i CoreOS — studion
          skickar aldrig något externt.
        </p>
        <div className="grid gap-4 rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-xl md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pkg-title">Pakettitel</Label>
            <Input
              id="pkg-title"
              value={pkg.title}
              onChange={(e) => setPkg({ ...pkg, title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-truth">Sanningsstatus</Label>
            <Select
              value={pkg.truth_label}
              onValueChange={(v) => setPkg({ ...pkg, truth_label: v })}
            >
              <SelectTrigger id="pkg-truth">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVED">APPROVED</SelectItem>
                <SelectItem value="EXPORTED">EXPORTED</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-subject">Ämne</Label>
            <Input
              id="pkg-subject"
              value={pkg.subject}
              onChange={(e) => setPkg({ ...pkg, subject: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-expires">Giltigt till</Label>
            <Input
              id="pkg-expires"
              type="date"
              value={pkg.expires_at}
              onChange={(e) => setPkg({ ...pkg, expires_at: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-name">Mottagarens namn</Label>
            <Input
              id="pkg-name"
              value={pkg.recipient_name}
              onChange={(e) => setPkg({ ...pkg, recipient_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-email">Mottagarens e-post</Label>
            <Input
              id="pkg-email"
              type="email"
              value={pkg.recipient_email}
              onChange={(e) => setPkg({ ...pkg, recipient_email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-proj">Filmprojekt</Label>
            <Select
              value={pkg.film_project_id || "none"}
              onValueChange={(v) => setPkg({ ...pkg, film_project_id: v === "none" ? "" : v })}
            >
              <SelectTrigger id="pkg-proj">
                <SelectValue placeholder="Välj projekt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Inget projekt</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-asset">Fil</Label>
            <Select
              value={pkg.media_asset_id || "none"}
              onValueChange={(v) => setPkg({ ...pkg, media_asset_id: v === "none" ? "" : v })}
            >
              <SelectTrigger id="pkg-asset">
                <SelectValue placeholder="Välj fil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen fil</SelectItem>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.approval_status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="pkg-message">Meddelande</Label>
            <Textarea
              id="pkg-message"
              value={pkg.message}
              onChange={(e) => setPkg({ ...pkg, message: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Button
              onClick={() => {
                if (!pkg.title.trim() || !pkg.recipient_email.includes("@")) {
                  toast.error("Titel och giltig e-postadress krävs.");
                  return;
                }
                void createPackage({
                  data: {
                    title: pkg.title,
                    subject: pkg.subject || null,
                    message: pkg.message || null,
                    truth_label: pkg.truth_label,
                    film_project_id: pkg.film_project_id || null,
                    media_asset_id: pkg.media_asset_id || null,
                    coreos_entity_type: selected?.type ?? null,
                    coreos_entity_id: selected?.id ?? null,
                    coreos_display_name: selected?.label ?? null,
                    expires_at: pkg.expires_at || null,
                    recipients: [
                      {
                        full_name: pkg.recipient_name || pkg.recipient_email,
                        email: pkg.recipient_email,
                      },
                    ],
                  },
                }).then(
                  () => {
                    toast.success("Leveranspaketet är skapat som utkast.");
                    setPkg({ ...pkg, title: "", recipient_email: "", recipient_name: "" });
                    invalidate();
                  },
                  (err: unknown) =>
                    toast.error(err instanceof Error ? err.message : "Kunde inte skapa paketet."),
                );
              }}
            >
              <Send aria-hidden="true" />
              Skapa leveranspaket
            </Button>
          </div>
        </div>

        <ul className="space-y-3">
          {(packages.data?.packages ?? []).map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-4"
            >
              <div>
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.coreos_display_name ?? "Ingen CoreOS-post"} · {p.status}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TruthBadge label={p.truth_label} />
                {p.status === "DRAFT" ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      void confirmPackage({ data: { id: p.id } }).then(
                        (res) => {
                          toast.message(res.message);
                          invalidate();
                        },
                        (err: unknown) =>
                          toast.error(
                            err instanceof Error ? err.message : "Bekräftelsen misslyckades.",
                          ),
                      )
                    }
                  >
                    Bekräfta leverans
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
          {(packages.data?.packages ?? []).length === 0 ? (
            <li className="rounded-xl border border-border bg-card/60 p-6 text-sm text-muted-foreground">
              Inga leveranspaket ännu.
            </li>
          ) : null}
        </ul>
      </section>

      <section aria-label="Spårlogg" className="space-y-3">
        <h2 className="text-lg font-semibold">Spårlogg</h2>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card/60">
          {(audit.data ?? []).slice(0, 25).map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs"
            >
              <span className="font-medium">{e.action}</span>
              <span className="text-muted-foreground">
                {e.actor_email ?? "okänd"} · {new Date(e.created_at).toLocaleString("sv-SE")}
              </span>
            </li>
          ))}
          {(audit.data ?? []).length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">Inga händelser loggade ännu.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
