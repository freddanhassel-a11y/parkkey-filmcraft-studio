import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, PackageCheck, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  getCoreosContext,
  searchCoreos,
  type CoreosEntity,
  type CoreosRecord,
} from "@/lib/coreos.functions";
import {
  confirmDeliveryPackage,
  createDeliveryPackage,
  listDeliveryPackages,
} from "@/lib/delivery.functions";
import { SectionHeading } from "@/components/studio/brand";
import { StatusBadge, TruthBadge } from "@/components/studio/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/studio/assets")({
  head: () => ({
    meta: [
      { title: "Kundleveranser — ParkKey™ Film Studio" },
      {
        name: "description",
        content:
          "Förbered godkänt ParkKey-material för exakt CoreOS-kontakt med serververifierad approval och explicit bekräftelse.",
      },
    ],
  }),
  component: DeliveryPage,
});

type Contact = { id: string; full_name: string | null; email: string | null };

const TYPE_LABEL: Record<string, string> = {
  municipality: "Kommun",
  operator: "Operatör",
  contact: "Kontakt",
  pilot: "Pilot",
  opportunity: "Opportunity",
};

function DeliveryPage() {
  const qc = useQueryClient();
  const search = useServerFn(searchCoreos);
  const getContext = useServerFn(getCoreosContext);
  const listPackages = useServerFn(listDeliveryPackages);
  const createPackage = useServerFn(createDeliveryPackage);
  const confirmPackage = useServerFn(confirmDeliveryPackage);

  const delivery = useQuery({
    queryKey: ["delivery-center"],
    queryFn: () => listPackages(),
  });

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<CoreosEntity[]>([]);
  const [denied, setDenied] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<CoreosEntity | null>(null);
  const [context, setContext] = useState<CoreosRecord | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [searching, setSearching] = useState(false);
  const [confirmedPackageId, setConfirmedPackageId] = useState<string | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const [draft, setDraft] = useState({
    title: "",
    subject: "",
    message: "",
    truth_label: "APPROVED",
    film_project_id: "",
    media_asset_id: "",
    social_post_id: "",
    expires_at: "",
  });

  const selectedContact = contacts.find((contact) => contact.id === contactId) ?? null;

  const approvedProjects = useMemo(
    () =>
      (delivery.data?.projects ?? []).filter((item) =>
        ["APPROVED", "EXPORTED"].includes(item.status),
      ),
    [delivery.data?.projects],
  );
  const approvedAssets = useMemo(
    () =>
      (delivery.data?.assets ?? []).filter((item) =>
        ["APPROVED", "EXPORTED"].includes(item.approval_status),
      ),
    [delivery.data?.assets],
  );
  const approvedPosts = useMemo(
    () =>
      (delivery.data?.posts ?? []).filter((item) => ["APPROVED", "EXPORTED"].includes(item.status)),
    [delivery.data?.posts],
  );

  const hasApprovedMaterial = Boolean(
    draft.film_project_id || draft.media_asset_id || draft.social_post_id,
  );

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["delivery-center"] });

  async function runSearch(event: React.FormEvent) {
    event.preventDefault();
    setSearching(true);
    try {
      const response = await search({ data: { term } });
      setResults(response.results);
      setDenied(response.denied);
      if (response.results.length === 0) toast.message("Inga CoreOS-träffar.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "CoreOS-sökningen misslyckades.");
    } finally {
      setSearching(false);
    }
  }

  async function chooseEntity(entity: CoreosEntity) {
    setSelectedEntity(entity);
    setContext(null);
    setContacts([]);
    setContactId("");
    try {
      const response = await getContext({ data: { type: entity.type, id: entity.id } });
      setContext(response.record);
      setContacts(response.contacts.filter((contact) => Boolean(contact.email)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kundkontexten kunde inte hämtas.");
    }
  }

  async function createDraft() {
    if (!selectedEntity) {
      toast.error("Välj först en CoreOS-post.");
      return;
    }
    if (!selectedContact?.email) {
      toast.error("Välj en CoreOS-kontakt med verifierbar e-postadress.");
      return;
    }
    if (!draft.title.trim()) {
      toast.error("Pakettitel krävs.");
      return;
    }
    if (!hasApprovedMaterial) {
      toast.error("Välj minst ett APPROVED/EXPORTED materialobjekt.");
      return;
    }

    try {
      const row = await createPackage({
        data: {
          title: draft.title.trim(),
          subject: draft.subject.trim() || null,
          message: draft.message.trim() || null,
          truth_label: draft.truth_label,
          film_project_id: draft.film_project_id || null,
          media_asset_id: draft.media_asset_id || null,
          social_post_id: draft.social_post_id || null,
          coreos_entity_type: selectedEntity.type,
          coreos_entity_id: selectedEntity.id,
          coreos_display_name: selectedEntity.label,
          expires_at: draft.expires_at || null,
          recipients: [
            {
              full_name: selectedContact.full_name || selectedContact.email,
              email: selectedContact.email,
              coreos_contact_id: selectedContact.id,
            },
          ],
        },
      });
      toast.success("Leveranspaketet skapades som DRAFT efter serververifiering.");
      setConfirmedPackageId(row.id);
      setConfirmChecked(false);
      invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Paketet kunde inte skapas.");
    }
  }

  async function confirmSelectedPackage() {
    if (!confirmedPackageId || !confirmChecked) return;
    try {
      const response = await confirmPackage({ data: { id: confirmedPackageId } });
      toast.message(response.message);
      setConfirmChecked(false);
      setConfirmedPackageId(null);
      invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bekräftelsen misslyckades.");
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Delivery Center"
        title="Kundleveranser"
        description="Välj en verklig CoreOS-post och exakt CoreOS-kontakt. Film Studio verifierar materialet server-side och förbereder leveransen — inget skickas externt härifrån."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <ProofCard
          title="1. CoreOS-kontakt"
          text="Mottagaren måste matcha en verklig CoreOS-kontakt."
        />
        <ProofCard
          title="2. Godkänt material"
          text="Backend kräver APPROVED eller EXPORTED source-of-truth."
        />
        <ProofCard
          title="3. Explicit bekräftelse"
          text="Slutläget blir READY TO SEND IN COREOS, aldrig fejkad SENT."
        />
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-card/70 p-6">
        <h2 className="text-lg font-semibold">Mottagarkontext</h2>
        <form onSubmit={runSearch} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1 space-y-1.5">
            <Label htmlFor="delivery-search">Sök i CoreOS</Label>
            <Input
              id="delivery-search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Kommun, operatör, kontakt, pilot eller opportunity"
            />
          </div>
          <Button type="submit" disabled={searching}>
            <Search aria-hidden="true" />
            {searching ? "Söker…" : "Sök"}
          </Button>
        </form>

        {denied.length > 0 ? (
          <p className="text-xs text-status-unknown">
            CoreOS nekade åtkomst till: {denied.join(", ")}. Ingen data antas.
          </p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((entity) => (
            <button
              key={`${entity.type}-${entity.id}`}
              type="button"
              onClick={() => void chooseEntity(entity)}
              aria-current={selectedEntity?.id === entity.id}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selectedEntity?.id === entity.id
                  ? "border-primary bg-accent"
                  : "border-border bg-background/50 hover:bg-accent/50"
              }`}
            >
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {TYPE_LABEL[entity.type] ?? entity.type}
              </span>
              <span className="mt-1 block text-sm font-semibold">{entity.label}</span>
              {entity.sublabel ? (
                <span className="block text-xs text-muted-foreground">{entity.sublabel}</span>
              ) : null}
            </button>
          ))}
        </div>

        {selectedEntity && context ? (
          <div className="grid gap-4 border-t border-border pt-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">{selectedEntity.label}</p>
              <p className="text-xs text-muted-foreground">
                {TYPE_LABEL[selectedEntity.type] ?? selectedEntity.type} · {selectedEntity.id}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coreos-recipient">Exakt CoreOS-kontakt</Label>
              <Select
                value={contactId || "none"}
                onValueChange={(value) => setContactId(value === "none" ? "" : value)}
              >
                <SelectTrigger id="coreos-recipient">
                  <SelectValue placeholder="Välj mottagare" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Välj kontakt</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.full_name || contact.email} · {contact.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {contacts.length === 0 ? (
                <p className="text-xs text-status-unknown">
                  Ingen kontakt med e-post kunde verifieras för den här CoreOS-posten.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card/70 p-6">
        <h2 className="text-lg font-semibold">Leveranspaket</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Pakettitel" id="delivery-title">
            <Input
              id="delivery-title"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </Field>
          <Field label="Sanningsstatus" id="delivery-truth">
            <Select
              value={draft.truth_label}
              onValueChange={(value) => setDraft({ ...draft, truth_label: value })}
            >
              <SelectTrigger id="delivery-truth">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVED">APPROVED</SelectItem>
                <SelectItem value="EXPORTED">EXPORTED</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Ämne" id="delivery-subject">
            <Input
              id="delivery-subject"
              value={draft.subject}
              onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
            />
          </Field>
          <Field label="Giltigt till" id="delivery-expiry">
            <Input
              id="delivery-expiry"
              type="date"
              value={draft.expires_at}
              onChange={(event) => setDraft({ ...draft, expires_at: event.target.value })}
            />
          </Field>
          <Field label="Godkänt filmprojekt" id="delivery-project">
            <Select
              value={draft.film_project_id || "none"}
              onValueChange={(value) =>
                setDraft({ ...draft, film_project_id: value === "none" ? "" : value })
              }
            >
              <SelectTrigger id="delivery-project">
                <SelectValue placeholder="Valfritt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Inget filmprojekt</SelectItem>
                {approvedProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title} · {project.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Godkänt media" id="delivery-asset">
            <Select
              value={draft.media_asset_id || "none"}
              onValueChange={(value) =>
                setDraft({ ...draft, media_asset_id: value === "none" ? "" : value })
              }
            >
              <SelectTrigger id="delivery-asset">
                <SelectValue placeholder="Valfritt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen mediafil</SelectItem>
                {approvedAssets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name} · {asset.approval_status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Godkänt socialt paket" id="delivery-post">
            <Select
              value={draft.social_post_id || "none"}
              onValueChange={(value) =>
                setDraft({ ...draft, social_post_id: value === "none" ? "" : value })
              }
            >
              <SelectTrigger id="delivery-post">
                <SelectValue placeholder="Valfritt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Inget socialt paket</SelectItem>
                {approvedPosts.map((post) => (
                  <SelectItem key={post.id} value={post.id}>
                    {post.title} · {post.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="delivery-message">Meddelande</Label>
            <Textarea
              id="delivery-message"
              value={draft.message}
              onChange={(event) => setDraft({ ...draft, message: event.target.value })}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background/50 p-4 text-sm">
          <p className="font-semibold">Förhandskontroll</p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <ProofRow label="CoreOS-post" value={selectedEntity?.label ?? "Ej vald"} />
            <ProofRow label="Mottagare" value={selectedContact?.email ?? "Ej vald"} />
            <ProofRow label="Godkänt material" value={hasApprovedMaterial ? "Valt" : "Saknas"} />
            <ProofRow label="Extern sändning" value="BLOCKERAD I FILM STUDIO" />
          </dl>
        </div>

        <Button
          onClick={() => void createDraft()}
          disabled={!selectedContact || !hasApprovedMaterial}
        >
          <PackageCheck aria-hidden="true" />
          Skapa verifierat DRAFT-paket
        </Button>
      </section>

      {confirmedPackageId ? (
        <section className="space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 text-primary" />
            <div>
              <h2 className="font-semibold">Explicit bekräftelse krävs</h2>
              <p className="text-sm text-muted-foreground">
                Detta skickar fortfarande inget mail. Bekräftelsen flyttar paketet till READY TO
                SEND IN COREOS och försöker logga leveransen på den kopplade CoreOS-posten.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="confirm-delivery"
              checked={confirmChecked}
              onCheckedChange={(value) => setConfirmChecked(value === true)}
            />
            <Label htmlFor="confirm-delivery" className="font-normal leading-relaxed">
              Jag har kontrollerat mottagare, material, sanningsstatus och meddelande.
            </Label>
          </div>
          <Button onClick={() => void confirmSelectedPackage()} disabled={!confirmChecked}>
            <CheckCircle2 aria-hidden="true" />
            Bekräfta — READY TO SEND IN COREOS
          </Button>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Leveranshistorik</h2>
        {delivery.isLoading ? (
          <p className="text-sm text-muted-foreground">Hämtar leveranser…</p>
        ) : null}
        {delivery.error ? (
          <p className="text-sm text-status-error">
            Kunde inte hämta leveranser: {delivery.error.message}
          </p>
        ) : null}
        <ul className="space-y-3">
          {(delivery.data?.packages ?? []).map((pkg) => {
            const recipients = (delivery.data?.recipients ?? []).filter(
              (recipient) => recipient.package_id === pkg.id,
            );
            return (
              <li key={pkg.id} className="rounded-xl border border-border bg-card/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{pkg.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {pkg.coreos_display_name ?? "Ingen CoreOS-post"} ·{" "}
                      {recipients.map((recipient) => recipient.email).join(", ") ||
                        "Ingen mottagare"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TruthBadge label={pkg.truth_label} />
                    <StatusBadge status={pkg.status} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function ProofCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function ProofRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
