import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { logAudit } from "./audit";
import { assertSafeRenderUrl, verifyExternalMp4 } from "./video-render-security";

export type VideoProviderState = {
  state: "CONNECTED" | "NOT CONNECTED" | "MANUAL CHECK" | "FAILED";
  provider: string | null;
  note: string;
  verifiedAt: string | null;
};

export const getVideoRenderPipeline = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator((d: { project_id: string }) => d)
  .handler(async ({ data, context }) => {
    const [project, versions, renders, connection] = await Promise.all([
      context.db
        .from("film_projects")
        .select("id,title,status,truth_label,duration_seconds,resolution,fps")
        .eq("id", data.project_id)
        .maybeSingle(),
      context.db
        .from("film_versions")
        .select("id,version_label,status,created_at")
        .eq("project_id", data.project_id)
        .order("created_at", { ascending: false }),
      context.db
        .from("renders")
        .select("*")
        .eq("project_id", data.project_id)
        .order("created_at", { ascending: false }),
      context.db
        .from("integration_connections")
        .select("provider,status,notes,verified_at")
        .eq("provider", "video-renderer")
        .maybeSingle(),
    ]);

    if (project.error) throw new Error(project.error.message);
    if (!project.data) throw new Error("Filmprojektet finns inte.");
    if (versions.error) throw new Error(versions.error.message);
    if (renders.error) throw new Error(renders.error.message);

    const row = connection.data;
    let providerState: VideoProviderState = {
      state: "NOT CONNECTED",
      provider: null,
      note: "VIDEO RENDERER — NOT CONNECTED",
      verifiedAt: null,
    };
    if (connection.error) {
      providerState = {
        state: "FAILED",
        provider: "video-renderer",
        note: connection.error.message,
        verifiedAt: null,
      };
    } else if (row?.status === "CONNECTED" && row.verified_at) {
      providerState = {
        state: "CONNECTED",
        provider: row.provider,
        note: row.notes ?? "Verifierad videorenderare.",
        verifiedAt: row.verified_at,
      };
    } else if (row?.status === "CONNECTED") {
      providerState = {
        state: "MANUAL CHECK",
        provider: row.provider,
        note: "Videorenderaren är markerad som ansluten men saknar verifieringstid.",
        verifiedAt: null,
      };
    } else if (row?.status === "CONFIGURED") {
      providerState = {
        state: "MANUAL CHECK",
        provider: row.provider,
        note:
          row.notes ??
          "Manual render fallback är konfigurerad. Registrera en verklig extern MP4 efter godkänd QA.",
        verifiedAt: row.verified_at ?? null,
      };
    }

    const master = (renders.data ?? []).find(
      (render) => render.status === "READY" && Boolean(render.file_url),
    );

    await logAudit(
      context.db,
      context,
      "render.provider.check",
      { type: "film_project", id: data.project_id },
      {
        provider_state: providerState.state,
        rendered_master_exists: Boolean(master),
      },
    );

    return {
      project: project.data,
      versions: versions.data ?? [],
      renders: renders.data ?? [],
      provider: providerState,
      master: master ?? null,
      masterState: master ? "RENDERED" : "No rendered file yet",
      stages: ["storyboard", "scene renders", "review", "master render", "export"] as const,
    };
  });

/**
 * Registers a REAL externally rendered MP4 only after the server can reach it
 * and the exact version has passed the server-side QA gate.
 */
export const registerRenderedMaster = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator(
    (d: {
      project_id: string;
      version_id?: string | null;
      provider: string;
      file_url: string;
      duration_seconds: number;
      width: number;
      height: number;
      fps: number;
      codec: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    let url: URL;
    try {
      url = new URL(data.file_url);
    } catch {
      throw new Error("Ogiltig render-URL.");
    }
    assertSafeRenderUrl(url);
    if (!data.provider.trim()) throw new Error("Provider krävs.");
    if (data.width <= 0 || data.height <= 0 || data.fps <= 0 || data.duration_seconds <= 0) {
      throw new Error("Ogiltig render-metadata.");
    }

    const { data: project, error: projectError } = await context.db
      .from("film_projects")
      .select("id")
      .eq("id", data.project_id)
      .maybeSingle();
    if (projectError) throw new Error(projectError.message);
    if (!project) throw new Error("Filmprojektet finns inte.");

    if (!data.version_id) {
      throw new Error("En specifik filmversion krävs för en verifierad master.");
    }

    const { data: version, error: versionError } = await context.db
      .from("film_versions")
      .select("id,project_id")
      .eq("id", data.version_id)
      .eq("project_id", data.project_id)
      .maybeSingle();
    if (versionError) throw new Error(versionError.message);
    if (!version) throw new Error("Filmversionen tillhör inte projektet.");

    const { data: qa, error: qaError } = await context.db
      .from("qa_checklists")
      .select("id,passed")
      .eq("project_id", data.project_id)
      .eq("version_id", data.version_id)
      .maybeSingle();
    if (qaError) throw new Error(qaError.message);
    if (!qa?.passed) {
      throw new Error("QA-grinden måste vara godkänd server-side innan en master kan registreras.");
    }

    const verified = await verifyExternalMp4(url);

    const { data: row, error } = await context.db
      .from("renders")
      .insert({
        project_id: data.project_id,
        version_id: data.version_id,
        provider: data.provider.trim(),
        status: "READY",
        file_url: verified.finalUrl.toString(),
        mime_type: verified.contentType,
        duration_seconds: Math.round(data.duration_seconds),
        width: Math.round(data.width),
        height: Math.round(data.height),
        fps: Math.round(data.fps),
        codec: data.codec.trim() || "H.264",
        error_message: null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await logAudit(
      context.db,
      context,
      "render.master.register",
      { type: "render", id: row.id },
      {
        project_id: data.project_id,
        version_id: data.version_id,
        provider: data.provider,
        qa_verified: true,
        file_verified_http: true,
        file_verified_allowlist: true,
        verified_content_type: verified.contentType,
        final_render_host: verified.finalUrl.hostname,
        width: data.width,
        height: data.height,
        fps: data.fps,
        codec: data.codec,
      },
    );

    return row;
  });
