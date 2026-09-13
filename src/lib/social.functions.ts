import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { logAudit } from "./audit";
import { getLinkedInCapabilityFromCoreos } from "./linkedin-capability";
import { buildSocialCreative, cropPresetsFor, type SocialBrief } from "./social-engine";

export const listSocialPosts = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const [posts, links, schedules, attempts, assets, projects] = await Promise.all([
      context.db.from("social_posts").select("*").order("created_at", { ascending: false }),
      context.db.from("social_post_assets").select("*").order("sort_order"),
      context.db.from("social_schedules").select("*").order("scheduled_at"),
      context.db.from("publish_attempts").select("*").order("created_at", { ascending: false }),
      context.db
        .from("media_assets")
        .select("id,name,kind,approval_status,storage_path,mime_type")
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
      context.db.from("film_projects").select("id,title,status").order("title"),
    ]);
    if (posts.error) throw new Error(posts.error.message);
    return {
      posts: posts.data ?? [],
      postAssets: links.data ?? [],
      schedules: schedules.data ?? [],
      attempts: attempts.data ?? [],
      assets: assets.data ?? [],
      projects: projects.data ?? [],
    };
  });

export const createSocialPost = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator(
    (
      d: SocialBrief & {
        film_project_id?: string | null;
        film_version_id?: string | null;
        coreos_entity_type?: string | null;
        coreos_entity_id?: string | null;
        coreos_display_name?: string | null;
        utm?: string | null;
        tags?: string[];
      },
    ) => d,
  )
  .handler(async ({ data, context }) => {
    if (!data.title?.trim()) throw new Error("Titel krävs.");
    const network = data.network ?? "LinkedIn";
    const creative = buildSocialCreative({ ...data, customer: data.coreos_display_name ?? null });

    const { data: row, error } = await context.db
      .from("social_posts")
      .insert({
        title: data.title.trim(),
        network,
        objective: data.objective ?? null,
        audience: data.audience ?? null,
        campaign: data.campaign ?? null,
        channel: data.network ?? null,
        aspect_ratio: data.aspect_ratio ?? "1:1",
        cta: data.cta ?? null,
        copy_direction: data.copy_direction ?? null,
        parky_usage: data.parky_usage ?? null,
        cinematic_mood: data.cinematic_mood ?? null,
        image_references: data.image_references ?? null,
        film_project_id: data.film_project_id ?? null,
        film_version_id: data.film_version_id ?? null,
        coreos_entity_type: data.coreos_entity_type ?? null,
        coreos_entity_id: data.coreos_entity_id ?? null,
        coreos_display_name: data.coreos_display_name ?? null,
        utm: data.utm ?? null,
        tags: data.tags ?? [],
        status: "DRAFT",
        truth_label: data.truth_label ?? "DEMO",
        copy_sv: creative.copy_sv,
        copy_en: creative.copy_en,
        headline: creative.headline,
        overlay_copy: creative.overlay_copy,
        image_prompt: creative.image_prompt,
        negative_prompt: creative.negative_prompt,
        alt_text: creative.alt_text,
        claim_check: creative.claim_check,
        crop_presets: creative.crop_presets,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await logAudit(
      context.db,
      context,
      "social.create",
      { type: "social_post", id: row.id },
      {
        network,
        title: row.title,
      },
    );
    return row;
  });

export const updateSocialPost = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator(
    (d: {
      id: string;
      patch: Partial<{
        title: string;
        network: string;
        aspect_ratio: string;
        copy_sv: string | null;
        copy_en: string | null;
        headline: string | null;
        overlay_copy: string | null;
        image_prompt: string | null;
        negative_prompt: string | null;
        alt_text: string | null;
        cta: string | null;
        utm: string | null;
        campaign: string | null;
        tags: string[];
        truth_label: string;
      }>;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { ...data.patch };
    if (typeof patch["network"] === "string") {
      patch["crop_presets"] = cropPresetsFor(patch["network"] as string);
    }
    const { data: row, error } = await context.db
      .from("social_posts")
      .update(patch as never)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await logAudit(
      context.db,
      context,
      "social.update",
      { type: "social_post", id: data.id },
      {
        fields: Object.keys(patch),
      },
    );
    return row;
  });

/** Regenererar det kreativa paketet från briefen utan att röra manuellt redigerad status. */
export const regenerateSocialCreative = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: post, error } = await context.db
      .from("social_posts")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const creative = buildSocialCreative({
      title: post.title,
      objective: post.objective,
      audience: post.audience,
      campaign: post.campaign,
      network: post.network,
      aspect_ratio: post.aspect_ratio,
      cta: post.cta,
      copy_direction: post.copy_direction,
      parky_usage: post.parky_usage,
      cinematic_mood: post.cinematic_mood,
      image_references: post.image_references,
      customer: post.coreos_display_name,
      truth_label: post.truth_label,
    });
    const { data: row, error: upErr } = await context.db
      .from("social_posts")
      .update({ ...creative })
      .eq("id", data.id)
      .select("*")
      .single();
    if (upErr) throw new Error(upErr.message);
    await logAudit(
      context.db,
      context,
      "social.update",
      { type: "social_post", id: data.id },
      {
        regenerated: true,
      },
    );
    return row;
  });

const FLOW: Record<string, string[]> = {
  DRAFT: ["REVIEW", "INTERNAL REVIEW"],
  REVIEW: ["APPROVED", "DRAFT"],
  "INTERNAL REVIEW": ["APPROVED", "DRAFT"],
  APPROVED: ["REVIEW", "INTERNAL REVIEW"],
  FAILED: ["DRAFT", "REVIEW", "INTERNAL REVIEW"],
};

export const setSocialPostStatus = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator((d: { id: string; status: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: post, error } = await context.db
      .from("social_posts")
      .select("status")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const allowed = FLOW[post.status] ?? [];
    if (!allowed.includes(data.status)) {
      throw new Error(`Kan inte gå från ${post.status} till ${data.status}.`);
    }
    const { data: row, error: upErr } = await context.db
      .from("social_posts")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("*")
      .single();
    if (upErr) throw new Error(upErr.message);
    await logAudit(
      context.db,
      context,
      "social.status",
      { type: "social_post", id: data.id },
      {
        from: post.status,
        to: data.status,
      },
    );
    return row;
  });

export const setSocialPostAssets = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator((d: { id: string; asset_ids: string[] }) => d)
  .handler(async ({ data, context }) => {
    await context.db.from("social_post_assets").delete().eq("post_id", data.id);
    if (data.asset_ids.length > 0) {
      const { error } = await context.db.from("social_post_assets").insert(
        data.asset_ids.map((assetId, i) => ({
          post_id: data.id,
          media_asset_id: assetId,
          sort_order: i,
        })),
      );
      if (error) throw new Error(error.message);
    }
    await logAudit(
      context.db,
      context,
      "social.update",
      { type: "social_post", id: data.id },
      {
        assets: data.asset_ids.length,
      },
    );
    return { ok: true };
  });

/**
 * Schemaläggning använder CoreOS' verifierade integrationsmodell. Om konto,
 * preflight, identitet, beviljade scopes eller publiceringssyfte inte kan
 * styrkas blir läget sanningsenligt CONNECTION REQUIRED/MANUAL CHECK.
 */
export const scheduleSocialPost = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator(
    (d: { id: string; scheduled_at: string; timezone: string; notes?: string | null }) => d,
  )
  .handler(async ({ data, context }) => {
    const { data: post, error } = await context.db
      .from("social_posts")
      .select("status,network")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    if (post.status !== "APPROVED" && !post.status.startsWith("SCHEDULED")) {
      throw new Error("Bara godkända inlägg kan schemaläggas.");
    }
    const when = new Date(data.scheduled_at);
    if (Number.isNaN(when.getTime())) throw new Error("Ogiltig tidpunkt.");
    if (when <= new Date()) throw new Error("Schematiden måste ligga i framtiden.");

    const capability = await getLinkedInCapabilityFromCoreos(context.coreos);
    const connected = capability.publishCapable;
    const status = connected ? "SCHEDULED" : "SCHEDULED — CONNECTION REQUIRED";

    const { data: row, error: sErr } = await context.db
      .from("social_schedules")
      .insert({
        post_id: data.id,
        scheduled_at: when.toISOString(),
        timezone: data.timezone || "Europe/Stockholm",
        notes: data.notes ?? null,
        status,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (sErr) throw new Error(sErr.message);

    await context.db.from("social_posts").update({ status }).eq("id", data.id);
    await logAudit(
      context.db,
      context,
      "social.schedule",
      { type: "social_schedule", id: row.id },
      {
        post_id: data.id,
        scheduled_at: row.scheduled_at,
        status,
        linkedin_capability: capability.state,
        granted_scope_count: capability.grantedScopes.length,
      },
    );
    return { schedule: row, connected, status, capability };
  });

export const cancelSchedule = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator((d: { schedule_id: string; post_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.db
      .from("social_schedules")
      .update({ status: "CANCELLED" })
      .eq("id", data.schedule_id);
    if (error) throw new Error(error.message);
    await context.db.from("social_posts").update({ status: "APPROVED" }).eq("id", data.post_id);
    await logAudit(
      context.db,
      context,
      "social.schedule",
      { type: "social_schedule", id: data.schedule_id },
      {
        cancelled: true,
      },
    );
    return { ok: true };
  });

/**
 * Publiceringsförsök. En verifierad CoreOS-kapacitet är nödvändig men inte
 * tillräcklig: tills en verklig LinkedIn API-adapter returnerar ett post-ID/URL
 * kan inget markeras som PUBLISHED.
 */
export const attemptPublish = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator((d: { post_id: string; schedule_id?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const capability = await getLinkedInCapabilityFromCoreos(context.coreos);
    if (!capability.publishCapable) {
      await context.db.from("publish_attempts").insert({
        post_id: data.post_id,
        schedule_id: data.schedule_id ?? null,
        provider: "linkedin",
        status: "BLOCKED — CONNECTION REQUIRED",
        error_message: `LinkedIn-publicering är inte verifierad i CoreOS. ${capability.note}`,
        attempted_by: context.userId,
      });
      await logAudit(
        context.db,
        context,
        "social.publish.blocked",
        { type: "social_post", id: data.post_id },
        {
          capability_state: capability.state,
          purpose: capability.purpose,
          granted_scope_count: capability.grantedScopes.length,
        },
      );
      return {
        published: false,
        capability,
        message:
          "Ingen verifierad LinkedIn-publiceringskapacitet. Inlägget står kvar i kön och inget publicerades.",
      };
    }

    await context.db.from("publish_attempts").insert({
      post_id: data.post_id,
      schedule_id: data.schedule_id ?? null,
      provider: "linkedin",
      status: "FAILED",
      error_message:
        "CoreOS har verifierat LinkedIn-kapaciteten, men Film Studios publiceringsadapter har ännu inte ett verifierat LinkedIn API-svar med post-ID/URL.",
      attempted_by: context.userId,
    });
    await logAudit(
      context.db,
      context,
      "social.publish.attempt",
      { type: "social_post", id: data.post_id },
      {
        capability_state: capability.state,
        purpose: capability.purpose,
        granted_scopes: capability.grantedScopes,
      },
    );
    return {
      published: false,
      capability,
      message:
        "LinkedIn-kapaciteten är verifierad i CoreOS, men inget verifierat publiceringssvar finns ännu. Inget markerades som PUBLISHED.",
    };
  });

export const duplicateSocialPost = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: post, error } = await context.db
      .from("social_posts")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = post;
    const { data: row, error: insErr } = await context.db
      .from("social_posts")
      .insert({
        ...rest,
        title: `${post.title} (kopia)`,
        status: "DRAFT",
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);
    const links = await context.db
      .from("social_post_assets")
      .select("media_asset_id,sort_order,alt_text")
      .eq("post_id", data.id);
    if (links.data?.length) {
      await context.db
        .from("social_post_assets")
        .insert(links.data.map((l) => ({ ...l, post_id: row.id })));
    }
    await logAudit(
      context.db,
      context,
      "social.create",
      { type: "social_post", id: row.id },
      {
        duplicated_from: data.id,
      },
    );
    return row;
  });
