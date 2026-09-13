import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { logAudit } from "./audit";

/**
 * Kundleverans. Studion bygger ALDRIG ett eget e-postsystem och skickar aldrig
 * något externt tyst. Ett paket blir "READY TO SEND IN COREOS" och registreras
 * som aktivitet på CoreOS-posten efter uttrycklig bekräftelse.
 */

export const listDeliveryPackages = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const [packages, recipients, projects, assets, posts] = await Promise.all([
      context.db.from("delivery_packages").select("*").order("created_at", { ascending: false }),
      context.db.from("delivery_recipients").select("*").order("created_at"),
      context.db.from("film_projects").select("id,title,status").order("title"),
      context.db
        .from("media_assets")
        .select("id,name,kind,approval_status,storage_path")
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
      context.db
        .from("social_posts")
        .select("id,title,status,network")
        .order("created_at", { ascending: false }),
    ]);
    if (packages.error) throw new Error(packages.error.message);
    return {
      packages: packages.data ?? [],
      recipients: recipients.data ?? [],
      projects: projects.data ?? [],
      assets: assets.data ?? [],
      posts: posts.data ?? [],
    };
  });

export const createDeliveryPackage = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator(
    (d: {
      title: string;
      subject?: string | null;
      message?: string | null;
      truth_label: string;
      film_project_id?: string | null;
      film_version_id?: string | null;
      media_asset_id?: string | null;
      social_post_id?: string | null;
      coreos_entity_type?: string | null;
      coreos_entity_id?: string | null;
      coreos_display_name?: string | null;
      expires_at?: string | null;
      recipients: Array<{
        full_name: string;
        email: string;
        coreos_contact_id?: string | null;
        role_note?: string | null;
      }>;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    if (!data.title?.trim()) throw new Error("Titel krävs.");
    if (!["APPROVED", "EXPORTED"].includes(data.truth_label)) {
      throw new Error("Endast APPROVED eller EXPORTED material får paketeras för kund.");
    }
    if (data.recipients.length === 0) throw new Error("Minst en mottagare krävs.");
    for (const r of data.recipients) {
      if (!r.email?.includes("@"))
        throw new Error(`Ogiltig e-postadress för ${r.full_name || "mottagare"}.`);
    }

    const { data: row, error } = await context.db
      .from("delivery_packages")
      .insert({
        title: data.title.trim(),
        subject: data.subject ?? null,
        message: data.message ?? null,
        truth_label: data.truth_label,
        film_project_id: data.film_project_id ?? null,
        film_version_id: data.film_version_id ?? null,
        media_asset_id: data.media_asset_id ?? null,
        social_post_id: data.social_post_id ?? null,
        coreos_entity_type: data.coreos_entity_type ?? null,
        coreos_entity_id: data.coreos_entity_id ?? null,
        coreos_display_name: data.coreos_display_name ?? null,
        expires_at: data.expires_at ?? null,
        status: "DRAFT",
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    const { error: rErr } = await context.db.from("delivery_recipients").insert(
      data.recipients.map((r) => ({
        package_id: row.id,
        full_name: r.full_name,
        email: r.email,
        coreos_contact_id: r.coreos_contact_id ?? null,
        role_note: r.role_note ?? null,
      })),
    );
    if (rErr) throw new Error(rErr.message);

    await logAudit(
      context.db,
      context,
      "delivery.package.create",
      { type: "delivery_package", id: row.id },
      {
        recipients: data.recipients.map((r) => r.email),
        truth_label: data.truth_label,
      },
    );
    return row;
  });

export const confirmDeliveryPackage = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: { id: string; secure_reference?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { data: pkg, error } = await context.db
      .from("delivery_packages")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const recipients = await context.db
      .from("delivery_recipients")
      .select("full_name,email")
      .eq("package_id", data.id);

    let coreosLogged = false;
    let coreosError: string | null = null;
    if (pkg.coreos_entity_id) {
      const activity: Record<string, string> = {
        kind: "material",
        title: `Kundleverans förberedd: ${pkg.title}`.slice(0, 180),
        notes: [
          `[${pkg.truth_label}] Leveranspaket från ParkKey Film Studio.`,
          `Mottagare: ${(recipients.data ?? []).map((r) => `${r.full_name} <${r.email}>`).join(", ")}`,
          pkg.film_project_id ? `film:${pkg.film_project_id}` : null,
          pkg.film_version_id ? `version:${pkg.film_version_id}` : null,
          pkg.media_asset_id ? `asset:${pkg.media_asset_id}` : null,
          data.secure_reference ? `Intern referens: ${data.secure_reference}` : null,
          "Utskicket sker i CoreOS — Film Studio skickar inget externt.",
        ]
          .filter(Boolean)
          .join("\n"),
        occurred_at: new Date().toISOString(),
      };
      if (pkg.coreos_entity_type === "municipality")
        activity["municipality_id"] = pkg.coreos_entity_id;
      if (pkg.coreos_entity_type === "contact") activity["contact_id"] = pkg.coreos_entity_id;
      const res = await context.coreos.from("activities").insert(activity as never);
      coreosLogged = !res.error;
      coreosError = res.error?.message ?? null;
    }

    const { data: row, error: upErr } = await context.db
      .from("delivery_packages")
      .update({
        status: "READY TO SEND IN COREOS",
        confirmed_at: new Date().toISOString(),
        confirmed_by: context.userId,
        secure_reference: data.secure_reference ?? null,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (upErr) throw new Error(upErr.message);

    await logAudit(
      context.db,
      context,
      "delivery.package.confirm",
      { type: "delivery_package", id: data.id },
      {
        recipients: (recipients.data ?? []).map((r) => r.email),
        coreosLogged,
        coreosError,
      },
    );

    return {
      package: row,
      coreosLogged,
      message: coreosLogged
        ? "Paketet är bekräftat och loggat på CoreOS-posten. Utskicket görs i CoreOS."
        : pkg.coreos_entity_id
          ? `Paketet är bekräftat, men CoreOS-loggningen nekades: ${coreosError ?? "okänt fel"}.`
          : "Paketet är bekräftat. Ingen CoreOS-post är kopplad, så loggning i CoreOS uteblev.",
    };
  });

export const listAuditEvents = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.db
      .from("audit_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
