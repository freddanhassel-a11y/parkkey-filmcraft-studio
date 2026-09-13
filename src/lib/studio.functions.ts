import { createServerFn } from "@tanstack/react-start";
import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { QA_GATE_ITEMS } from "./parkkey-rules";
import { generateDocuments, type FilmBrief } from "./prompt-engine";
import { STORYBOARD_TAG, storyboardQaItems } from "./storyboard-reference";

export type QaItem = { id: string; label: string; source: string; checked: boolean; note?: string };

const briefFromInput = (d: Record<string, unknown>): FilmBrief => ({
  title: String(d["title"] ?? "").trim(),
  campaign: (d["campaign"] as string | null) ?? null,
  goal: (d["goal"] as string | null) ?? null,
  audience: (d["audience"] as string | null) ?? null,
  duration_seconds: Number(d["duration_seconds"] ?? 30),
  aspect_ratio: String(d["aspect_ratio"] ?? "16:9"),
  resolution: String(d["resolution"] ?? "1920x1080"),
  fps: Number(d["fps"] ?? 30),
  channel: (d["channel"] as string | null) ?? null,
  cta: (d["cta"] as string | null) ?? null,
  visual_mood: (d["visual_mood"] as string | null) ?? null,
  location_time: (d["location_time"] as string | null) ?? null,
  parky_usage: (d["parky_usage"] as string | null) ?? null,
  device_interaction: (d["device_interaction"] as string | null) ?? null,
  music_direction: (d["music_direction"] as string | null) ?? null,
  voice_enabled: Boolean(d["voice_enabled"]),
  subtitles_enabled: Boolean(d["subtitles_enabled"]),
  sfx_enabled: Boolean(d["sfx_enabled"]),
  reference_media: (d["reference_media"] as string | null) ?? null,
  notes: (d["notes"] as string | null) ?? null,
  truth_label: (d["truth_label"] as string | null) ?? "DEMO",
  storyboard_locked: Array.isArray(d["tags"])
    ? (d["tags"] as unknown[]).some((t) => String(t) === STORYBOARD_TAG)
    : false,
});

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const supabase = context.db;
    const [projects, templates, renders, integrations] = await Promise.all([
      supabase
        .from("film_projects")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(24),
      supabase.from("prompt_templates").select("*").order("name"),
      supabase.from("renders").select("*").order("created_at", { ascending: false }).limit(8),
      supabase.from("integrations").select("*").order("display_name"),
    ]);
    if (projects.error) throw new Error(projects.error.message);
    return {
      projects: projects.data ?? [],
      templates: templates.data ?? [],
      renders: renders.data ?? [],
      integrations: integrations.data ?? [],
    };
  });

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.db
      .from("film_projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getProject = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const supabase = context.db;
    const project = await supabase
      .from("film_projects")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (project.error) throw new Error(project.error.message);
    if (!project.data) return null;
    const [versions, prompts, renders, qa] = await Promise.all([
      supabase.from("film_versions").select("*").eq("project_id", data.id).order("created_at"),
      supabase.from("prompts").select("*").eq("project_id", data.id).order("created_at"),
      supabase
        .from("renders")
        .select("*")
        .eq("project_id", data.id)
        .order("created_at", { ascending: false }),
      supabase.from("qa_checklists").select("*").eq("project_id", data.id),
    ]);
    return {
      project: project.data,
      versions: versions.data ?? [],
      prompts: prompts.data ?? [],
      renders: renders.data ?? [],
      qa: qa.data ?? [],
    };
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async ({ data, context }) => {
    const supabase = context.db;
    const brief = briefFromInput(data);
    if (!brief.title) throw new Error("Titel krävs.");

    const inserted = await supabase
      .from("film_projects")
      .insert({
        title: brief.title,
        campaign: brief.campaign,
        goal: brief.goal,
        audience: brief.audience,
        duration_seconds: brief.duration_seconds,
        aspect_ratio: brief.aspect_ratio,
        resolution: brief.resolution,
        fps: brief.fps,
        channel: brief.channel,
        cta: brief.cta,
        visual_mood: brief.visual_mood,
        location_time: brief.location_time,
        parky_usage: brief.parky_usage,
        device_interaction: brief.device_interaction,
        music_direction: brief.music_direction,
        voice_enabled: brief.voice_enabled,
        subtitles_enabled: brief.subtitles_enabled,
        sfx_enabled: brief.sfx_enabled,
        reference_media: brief.reference_media,
        notes: brief.notes,
        truth_label: brief.truth_label ?? "DEMO",
        tags: Array.isArray(data["tags"]) ? (data["tags"] as string[]) : [],
        status: "PROMPT READY",
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (inserted.error) throw new Error(inserted.error.message);
    const project = inserted.data;

    const version = await supabase
      .from("film_versions")
      .insert({
        project_id: project.id,
        version_label: "V1",
        changelog: "Första version. Prompts genererade från ParkKey-reglerna.",
        status: "PROMPT READY",
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (version.error) throw new Error(version.error.message);

    const docs = generateDocuments(brief);
    const promptRows = docs.map((doc) => ({
      project_id: project.id,
      version_id: version.data.id,
      kind: doc.kind,
      title: doc.title,
      content: doc.content,
      created_by: context.userId,
    }));
    const promptsRes = await supabase.from("prompts").insert(promptRows);
    if (promptsRes.error) throw new Error(promptsRes.error.message);

    const qaRes = await supabase.from("qa_checklists").insert({
      project_id: project.id,
      version_id: version.data.id,
      items: [
        ...QA_GATE_ITEMS.map((i) => ({ ...i, checked: false })),
        ...(brief.storyboard_locked ? storyboardQaItems() : []),
      ],
      passed: false,
      created_by: context.userId,
    });
    if (qaRes.error) throw new Error(qaRes.error.message);

    await supabase.from("renders").insert({
      project_id: project.id,
      version_id: version.data.id,
      provider: "manual-upload",
      status: "NO FILE",
      created_by: context.userId,
    });

    return { projectId: project.id, versionId: version.data.id };
  });

export const regeneratePrompts = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: { projectId: string; versionId: string }) => d)
  .handler(async ({ data, context }) => {
    const supabase = context.db;
    const project = await supabase
      .from("film_projects")
      .select("*")
      .eq("id", data.projectId)
      .single();
    if (project.error) throw new Error(project.error.message);
    const docs = generateDocuments(
      briefFromInput(project.data as unknown as Record<string, unknown>),
    );
    await supabase.from("prompts").delete().eq("version_id", data.versionId);
    const res = await supabase.from("prompts").insert(
      docs.map((doc) => ({
        project_id: data.projectId,
        version_id: data.versionId,
        kind: doc.kind,
        title: doc.title,
        content: doc.content,
        created_by: context.userId,
      })),
    );
    if (res.error) throw new Error(res.error.message);
    return { ok: true, count: docs.length };
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.db
      .from("film_projects")
      .update(data.patch as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateVersion = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: { projectId: string; versionId: string; changelog?: string }) => d)
  .handler(async ({ data, context }) => {
    const supabase = context.db;
    const existing = await supabase
      .from("film_versions")
      .select("*")
      .eq("project_id", data.projectId)
      .order("created_at");
    if (existing.error) throw new Error(existing.error.message);
    const next = `V${(existing.data?.length ?? 0) + 1}`;
    const created = await supabase
      .from("film_versions")
      .insert({
        project_id: data.projectId,
        version_label: next,
        changelog: data.changelog?.trim() || `Kopierad från befintlig version.`,
        status: "PROMPT READY",
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (created.error) throw new Error(created.error.message);

    const source = await supabase.from("prompts").select("*").eq("version_id", data.versionId);
    if (source.data?.length) {
      await supabase.from("prompts").insert(
        source.data.map((p) => ({
          project_id: data.projectId,
          version_id: created.data.id,
          kind: p.kind,
          title: p.title,
          content: p.content,
          created_by: context.userId,
        })),
      );
    }
    await supabase.from("qa_checklists").insert({
      project_id: data.projectId,
      version_id: created.data.id,
      items: QA_GATE_ITEMS.map((i) => ({ ...i, checked: false })),
      passed: false,
      created_by: context.userId,
    });
    await supabase.from("renders").insert({
      project_id: data.projectId,
      version_id: created.data.id,
      provider: "manual-upload",
      status: "NO FILE",
      created_by: context.userId,
    });
    return { versionId: created.data.id, label: next };
  });

export const saveQa = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: { qaId: string; items: QaItem[] }) => d)
  .handler(async ({ data, context }) => {
    const passed = data.items.every((i) => i.checked);
    const { error } = await context.db
      .from("qa_checklists")
      .update({ items: data.items, passed })
      .eq("id", data.qaId);
    if (error) throw new Error(error.message);
    return { passed };
  });

export const registerRender = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator(
    (d: {
      renderId: string;
      file_url: string;
      duration_seconds?: number | null;
      width?: number | null;
      height?: number | null;
      fps?: number | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const url = data.file_url.trim();
    if (!/^https?:\/\//i.test(url))
      throw new Error("Ange en fullständig https-adress till MP4-filen.");
    const { error } = await context.db
      .from("renders")
      .update({
        file_url: url,
        status: "READY",
        mime_type: "video/mp4",
        codec: "H.264",
        duration_seconds: data.duration_seconds ?? null,
        width: data.width ?? null,
        height: data.height ?? null,
        fps: data.fps ?? 30,
        error_message: null,
      })
      .eq("id", data.renderId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listLibrary = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const supabase = context.db;
    const [projects, renders, tags] = await Promise.all([
      supabase.from("film_projects").select("*").order("updated_at", { ascending: false }),
      supabase.from("renders").select("*"),
      supabase.from("tags").select("*").order("label"),
    ]);
    return { projects: projects.data ?? [], renders: renders.data ?? [], tags: tags.data ?? [] };
  });

export const listAssets = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.db
      .from("assets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createAsset = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator(
    (d: {
      name: string;
      category: string;
      kind: string;
      url?: string | null;
      notes?: string | null;
      tags?: string[];
    }) => d,
  )
  .handler(async ({ data, context }) => {
    if (!data.name.trim()) throw new Error("Namn krävs.");
    const url = data.url?.trim() ? data.url.trim() : null;
    if (url && !/^https?:\/\//i.test(url)) throw new Error("Länken måste börja med http(s)://");
    const { error } = await context.db.from("assets").insert({
      name: data.name.trim(),
      category: data.category,
      kind: data.kind,
      url,
      notes: data.notes ?? null,
      tags: data.tags ?? [],
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTemplates = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.db
      .from("prompt_templates")
      .select("*")
      .order("is_builtin", { ascending: false })
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createTemplate = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator(
    (d: { name: string; category: string; description?: string | null; body: string }) => d,
  )
  .handler(async ({ data, context }) => {
    if (!data.name.trim() || !data.body.trim()) throw new Error("Namn och innehåll krävs.");
    const { error } = await context.db.from("prompt_templates").insert({
      name: data.name.trim(),
      category: data.category,
      description: data.description ?? null,
      body: data.body,
      is_builtin: false,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.db.from("integrations").select("*").order("display_name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });
