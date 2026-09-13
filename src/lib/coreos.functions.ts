import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { logAudit } from "./audit";

/**
 * Smal databrygga mot CoreOS. All läsning sker med användarens EGEN token, så
 * CoreOS RLS gäller — studion har ingen egen kopia av kundregistret och
 * webbläsaren kan aldrig läsa CoreOS-tabeller direkt.
 */

export type CoreosEntityType = "municipality" | "operator" | "contact" | "pilot";

export type CoreosValue = string | number | boolean | null | string[];
export type CoreosRecord = Record<string, CoreosValue>;

export type CoreosEntity = {
  type: CoreosEntityType;
  id: string;
  label: string;
  sublabel: string | null;
  status: string | null;
};

function limitTerm(term: string) {
  return term
    .trim()
    .replace(/[%,()]/g, "")
    .slice(0, 80);
}

export const searchCoreos = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: { term: string }) => d)
  .handler(async ({ data, context }) => {
    const term = limitTerm(data.term ?? "");
    const like = `%${term}%`;
    const results: CoreosEntity[] = [];
    const denied: string[] = [];

    const municipalities = await context.coreos
      .from("municipalities")
      .select("id,name,status,next_step")
      .ilike("name", like)
      .limit(8);
    if (municipalities.error) denied.push("kommuner");
    for (const m of municipalities.data ?? []) {
      results.push({
        type: "municipality",
        id: m.id as string,
        label: m.name as string,
        sublabel: (m.next_step as string | null) ?? null,
        status: (m.status as string | null) ?? null,
      });
    }

    const operators = await context.coreos
      .from("mobility_operators")
      .select("id,legal_entity,sector,status")
      .ilike("legal_entity", like)
      .limit(8);
    if (operators.error) denied.push("operatörer");
    for (const o of operators.data ?? []) {
      results.push({
        type: "operator",
        id: o.id as string,
        label: o.legal_entity as string,
        sublabel: (o.sector as string | null) ?? null,
        status: (o.status as string | null) ?? null,
      });
    }

    const contacts = await context.coreos
      .from("contacts")
      .select("id,full_name,email,organisation")
      .or(`full_name.ilike.${like},email.ilike.${like},organisation.ilike.${like}`)
      .limit(8);
    if (contacts.error) denied.push("kontakter");
    for (const c of contacts.data ?? []) {
      results.push({
        type: "contact",
        id: c.id as string,
        label: (c.full_name as string) ?? (c.email as string),
        sublabel: (c.organisation as string | null) ?? (c.email as string | null),
        status: null,
      });
    }

    const pilots = await context.coreos
      .from("pilot_cases")
      .select("id,name,municipality_name,mode")
      .ilike("name", like)
      .limit(8);
    if (pilots.error) denied.push("pilotfall");
    for (const p of pilots.data ?? []) {
      results.push({
        type: "pilot",
        id: p.id as string,
        label: p.name as string,
        sublabel: (p.municipality_name as string | null) ?? (p.mode as string | null),
        status: null,
      });
    }

    return { results, denied };
  });

/** Hämtar godkänd/känd kundkontext för ett CoreOS-objekt — inget fritt tabellåtkomst. */
export const getCoreosContext = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: { type: CoreosEntityType; id: string }) => d)
  .handler(async ({ data, context }) => {
    let record: CoreosRecord | null = null;
    let contacts: Array<{ id: string; full_name: string | null; email: string | null }> = [];

    if (data.type === "municipality") {
      const res = await context.coreos
        .from("municipalities")
        .select("id,name,official_code,status,next_step,next_step_due,owner,tags")
        .eq("id", data.id)
        .maybeSingle();
      if (res.error) throw new Error(`CoreOS nekade läsning: ${res.error.message}`);
      record = res.data as CoreosRecord | null;
      const c = await context.coreos
        .from("contacts")
        .select("id,full_name,email")
        .eq("municipality_id", data.id)
        .limit(25);
      contacts = (c.data ?? []) as typeof contacts;
    } else if (data.type === "operator") {
      const res = await context.coreos
        .from("mobility_operators")
        .select("id,legal_entity,org_number,sector,status")
        .eq("id", data.id)
        .maybeSingle();
      if (res.error) throw new Error(`CoreOS nekade läsning: ${res.error.message}`);
      record = res.data as CoreosRecord | null;
    } else if (data.type === "contact") {
      const res = await context.coreos
        .from("contacts")
        .select("id,full_name,email,organisation,municipality_id,tags")
        .eq("id", data.id)
        .maybeSingle();
      if (res.error) throw new Error(`CoreOS nekade läsning: ${res.error.message}`);
      record = res.data as CoreosRecord | null;
      if (record) {
        contacts = [
          {
            id: record["id"] as string,
            full_name: (record["full_name"] as string | null) ?? null,
            email: (record["email"] as string | null) ?? null,
          },
        ];
      }
    } else {
      const res = await context.coreos
        .from("pilot_cases")
        .select("id,name,municipality_name,mode")
        .eq("id", data.id)
        .maybeSingle();
      if (res.error) throw new Error(`CoreOS nekade läsning: ${res.error.message}`);
      record = res.data as CoreosRecord | null;
    }

    if (!record) throw new Error("Objektet finns inte i CoreOS eller är inte synligt för dig.");

    await logAudit(context.db, context, "coreos.context.import", {
      type: `coreos_${data.type}`,
      id: data.id,
    });
    return { record, contacts };
  });

export const listMaterialLinks = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const [customer, coreos, projects, assets] = await Promise.all([
      context.db
        .from("customer_material_links")
        .select("*")
        .order("created_at", { ascending: false }),
      context.db
        .from("coreos_material_links")
        .select("*")
        .order("created_at", { ascending: false }),
      context.db.from("film_projects").select("id,title,status,truth_label").order("title"),
      context.db
        .from("media_assets")
        .select("id,name,kind,approval_status,storage_path")
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
    ]);
    if (customer.error) throw new Error(customer.error.message);
    return {
      customerLinks: customer.data ?? [],
      coreosLinks: coreos.data ?? [],
      projects: projects.data ?? [],
      assets: assets.data ?? [],
    };
  });

export const linkCustomerMaterial = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator(
    (d: {
      coreos_type: CoreosEntityType;
      coreos_id: string;
      coreos_label: string;
      film_project_id?: string | null;
      media_asset_id?: string | null;
      context_snapshot?: CoreosRecord;
      notes?: string | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.db
      .from("customer_material_links")
      .insert({
        coreos_entity_type: data.coreos_type,
        coreos_entity_id: data.coreos_id,
        display_name: data.coreos_label,
        film_project_id: data.film_project_id ?? null,
        media_asset_id: data.media_asset_id ?? null,
        display_meta: data.context_snapshot ?? {},
        notes: data.notes ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await logAudit(
      context.db,
      context,
      "coreos.link",
      { type: "customer_material_link", id: row.id },
      {
        coreos_id: data.coreos_id,
        coreos_type: data.coreos_type,
      },
    );
    return row;
  });

/**
 * Skriver tillbaka färdigt material till CoreOS som en aktivitet med användarens
 * egen token. Sanningsstatus följer med — utkast blir aldrig ett godkänt kundpåstående.
 */
export const exportMaterialToCoreos = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator(
    (d: {
      coreos_type: CoreosEntityType;
      coreos_id: string;
      coreos_label: string;
      film_project_id?: string | null;
      film_version_id?: string | null;
      media_asset_id?: string | null;
      truth_label: string;
      summary: string;
      preview_reference?: string | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    if (!["DEMO", "PROPOSED", "APPROVED", "EXPORTED"].includes(data.truth_label)) {
      throw new Error("Ogiltig sanningsstatus.");
    }
    const idLine = [
      data.film_project_id ? `film:${data.film_project_id}` : null,
      data.film_version_id ? `version:${data.film_version_id}` : null,
      data.media_asset_id ? `asset:${data.media_asset_id}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const body = [
      `[${data.truth_label}] ${data.summary}`,
      idLine ? `Film Studio-ID: ${idLine}` : null,
      data.preview_reference ? `Intern förhandsvisning: ${data.preview_reference}` : null,
      "Skickat från ParkKey Film Studio — Material Hub.",
    ]
      .filter(Boolean)
      .join("\n");

    const activity: Record<string, string> = {
      kind: "material",
      title: `Film Studio-material: ${data.summary}`.slice(0, 180),
      notes: body,
      occurred_at: new Date().toISOString(),
    };
    if (data.coreos_type === "municipality") activity["municipality_id"] = data.coreos_id;
    if (data.coreos_type === "contact") activity["contact_id"] = data.coreos_id;

    const res = await context.coreos
      .from("activities")
      .insert(activity as never)
      .select("id")
      .maybeSingle();

    const delivered = !res.error;
    const { data: row, error } = await context.db
      .from("coreos_material_links")
      .insert({
        coreos_entity_type: data.coreos_type,
        coreos_entity_id: data.coreos_id,
        display_name: data.coreos_label,
        coreos_activity_id: (res.data?.id as string | undefined) ?? null,
        film_project_id: data.film_project_id ?? null,
        film_version_id: data.film_version_id ?? null,
        media_asset_id: data.media_asset_id ?? null,
        truth_label: data.truth_label,
        direction: "to_coreos",
        status: delivered ? "DELIVERED" : "READY TO SEND IN COREOS",
        preview_reference: data.preview_reference ?? null,
        error_message: res.error?.message ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await logAudit(
      context.db,
      context,
      "coreos.material.export",
      { type: "coreos_material_link", id: row.id },
      {
        delivered,
        coreos_id: data.coreos_id,
        truth_label: data.truth_label,
        summary: data.summary,
      },
    );

    return {
      link: row,
      delivered,
      message: delivered
        ? "Materialet är registrerat på CoreOS-posten."
        : `CoreOS tog inte emot skrivningen: ${res.error?.message ?? "okänt fel"}. Posten står som READY TO SEND IN COREOS.`,
    };
  });
