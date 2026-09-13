import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { logAudit } from "./audit";
import { cropPresetsFor } from "./social-engine";

const SUPPORTED_FORMATS = new Set(["1:1", "4:5", "16:9", "9:16"]);

async function linkedinSchedulingState(
  db: SupabaseClient<Database>,
): Promise<"SCHEDULED" | "SCHEDULED — CONNECTION REQUIRED"> {
  const { data, error } = await db
    .from("integration_connections")
    .select("status,verified_at")
    .eq("provider", "linkedin")
    .maybeSingle();
  if (error || data?.status !== "CONNECTED" || !data.verified_at) {
    return "SCHEDULED — CONNECTION REQUIRED";
  }
  return "SCHEDULED";
}

export const rescheduleSocialSchedule = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator(
    (d: { schedule_id: string; scheduled_at: string; timezone?: string | null }) => d,
  )
  .handler(async ({ data, context }) => {
    const when = new Date(data.scheduled_at);
    if (Number.isNaN(when.getTime())) throw new Error("Ogiltig schematid.");
    if (when <= new Date()) throw new Error("Schematiden måste ligga i framtiden.");

    const { data: current, error } = await context.db
      .from("social_schedules")
      .select("id,post_id,scheduled_at,status,timezone")
      .eq("id", data.schedule_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!current) throw new Error("Schemaposten finns inte.");
    if (current.status === "CANCELLED") throw new Error("Ett avbrutet schema måste skapas om.");

    const status = await linkedinSchedulingState(context.db);
    const timezone = data.timezone?.trim() || current.timezone || "Europe/Stockholm";
    const { data: row, error: updateError } = await context.db
      .from("social_schedules")
      .update({ scheduled_at: when.toISOString(), timezone, status })
      .eq("id", data.schedule_id)
      .select("*")
      .single();
    if (updateError) throw new Error(updateError.message);

    await context.db.from("social_posts").update({ status }).eq("id", current.post_id);
    await logAudit(
      context.db,
      context,
      "social.schedule",
      { type: "social_schedule", id: data.schedule_id },
      {
        action: "reschedule",
        from: current.scheduled_at,
        to: row.scheduled_at,
        timezone,
        status,
      },
    );

    return { schedule: row, status };
  });

export const duplicateSocialPostForFormat = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: { post_id: string; aspect_ratio: string }) => d)
  .handler(async ({ data, context }) => {
    if (!SUPPORTED_FORMATS.has(data.aspect_ratio)) throw new Error("Formatet stöds inte.");

    const { data: source, error } = await context.db
      .from("social_posts")
      .select("*")
      .eq("id", data.post_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!source) throw new Error("Originalinlägget finns inte.");

    const {
      id: _id,
      created_at: _createdAt,
      updated_at: _updatedAt,
      created_by: _createdBy,
      ...copy
    } = source;
    const { data: row, error: insertError } = await context.db
      .from("social_posts")
      .insert({
        ...copy,
        title: `${source.title} — ${data.aspect_ratio}`,
        aspect_ratio: data.aspect_ratio,
        crop_presets: cropPresetsFor(source.network),
        status: "DRAFT",
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (insertError) throw new Error(insertError.message);

    const links = await context.db
      .from("social_post_assets")
      .select("media_asset_id,sort_order,alt_text")
      .eq("post_id", source.id)
      .order("sort_order");
    if (!links.error && (links.data ?? []).length > 0) {
      const { error: linkError } = await context.db.from("social_post_assets").insert(
        (links.data ?? []).map((link) => ({
          post_id: row.id,
          media_asset_id: link.media_asset_id,
          sort_order: link.sort_order,
          alt_text: link.alt_text,
        })),
      );
      if (linkError) throw new Error(linkError.message);
    }

    await logAudit(
      context.db,
      context,
      "social.create",
      { type: "social_post", id: row.id },
      {
        action: "duplicate_format",
        source_post_id: source.id,
        aspect_ratio: data.aspect_ratio,
      },
    );

    return row;
  });
