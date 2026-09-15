/* eslint-disable @typescript-eslint/no-explicit-any, prettier/prettier */
import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { logAudit } from "./audit";

type LinkedInMetricSnapshot = {
  reactions?: number | null;
  comments?: number | null;
  reposts?: number | null;
  impressions?: number | null;
  clicks?: number | null;
  engagement_rate?: number | null;
};

type LinkedInPostSnapshot = {
  linkedin_post_id: string;
  permalink?: string | null;
  author_id?: string | null;
  author_name?: string | null;
  post_type?: string | null;
  published_at?: string | null;
  last_modified_at?: string | null;
  text?: string | null;
  title?: string | null;
  metrics?: LinkedInMetricSnapshot | null;
  raw_summary?: Record<string, unknown> | null;
};

type LinkedInSnapshotInput = {
  source?: string;
  account_id?: string | null;
  account_name?: string | null;
  observed_from?: string | null;
  observed_to?: string | null;
  cursor_after?: string | null;
  posts: LinkedInPostSnapshot[];
};

const cleanCount = (value: number | null | undefined) => {
  if (value == null) return null;
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.trunc(value);
};

const cleanRate = (value: number | null | undefined) => {
  if (value == null) return null;
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
};

const parseIso = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const getLinkedInSyncStatus = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const db = context.db as any;
    const [latestRun, totals] = await Promise.all([
      db
        .from("linkedin_sync_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("social_posts")
        .select("id,linkedin_post_id,sync_confidence,metrics_status,last_synced_at", {
          count: "exact",
        })
        .eq("network", "LinkedIn"),
    ]);

    if (latestRun.error) throw new Error(latestRun.error.message);
    if (totals.error) throw new Error(totals.error.message);

    const rows = totals.data ?? [];
    return {
      latestRun: latestRun.data ?? null,
      totalLinkedInRows: totals.count ?? rows.length,
      verifiedPosts: rows.filter((row: any) => Boolean(row.linkedin_post_id)).length,
      assetOnlyRows: rows.filter((row: any) => row.sync_confidence === "ASSET_ONLY").length,
      verifiedMetricsRows: rows.filter((row: any) =>
        String(row.metrics_status ?? "").startsWith("VERIFIED"),
      ).length,
    };
  });

export const ingestLinkedInSnapshot = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator((data: LinkedInSnapshotInput) => data)
  .handler(async ({ data, context }) => {
    if (!Array.isArray(data.posts)) throw new Error("posts måste vara en lista.");
    if (data.posts.length > 5000) throw new Error("För många poster i en synkkörning.");

    const db = context.db as any;
    const source = data.source?.trim() || "linkedin_organic";
    const startedAt = new Date().toISOString();

    const { data: run, error: runError } = await db
      .from("linkedin_sync_runs")
      .insert({
        source,
        account_id: data.account_id ?? null,
        account_name: data.account_name ?? null,
        started_at: startedAt,
        status: "RUNNING",
        posts_seen: data.posts.length,
        cursor_after: data.cursor_after ?? null,
        observed_from: parseIso(data.observed_from),
        observed_to: parseIso(data.observed_to),
        created_by: context.userId,
      })
      .select("*")
      .single();

    if (runError) throw new Error(runError.message);

    let inserted = 0;
    let updated = 0;
    let metricsUpdated = 0;
    let warnings = 0;

    try {
      for (const incoming of data.posts) {
        const postId = incoming.linkedin_post_id?.trim();
        if (!postId) {
          warnings += 1;
          continue;
        }

        const publishedAt = parseIso(incoming.published_at);
        const lastModifiedAt = parseIso(incoming.last_modified_at);
        const observedAt = new Date().toISOString();

        const { data: existing, error: existingError } = await db
          .from("social_posts")
          .select("id,title,copy_sv,linkedin_post_id")
          .eq("linkedin_post_id", postId)
          .maybeSingle();
        if (existingError) throw new Error(existingError.message);

        const metrics = incoming.metrics ?? null;
        const normalizedMetrics = metrics
          ? {
              reactions: cleanCount(metrics.reactions),
              comments: cleanCount(metrics.comments),
              reposts: cleanCount(metrics.reposts),
              impressions: cleanCount(metrics.impressions),
              clicks: cleanCount(metrics.clicks),
              engagement_rate: cleanRate(metrics.engagement_rate),
            }
          : null;
        const hasAnyMetric = Boolean(
          normalizedMetrics && Object.values(normalizedMetrics).some((value) => value != null),
        );

        const patch = {
          title: incoming.title?.trim() || existing?.title || `LinkedIn ${postId}`,
          network: "LinkedIn",
          channel: "LinkedIn",
          copy_sv: incoming.text ?? existing?.copy_sv ?? null,
          status: "PUBLISHED",
          truth_label: "VERIFIED LINKEDIN",
          linkedin_post_id: postId,
          linkedin_author_id: incoming.author_id ?? null,
          linkedin_author_name: incoming.author_name ?? null,
          linkedin_post_type: incoming.post_type ?? null,
          linkedin_permalink: incoming.permalink ?? null,
          source_post_url: incoming.permalink ?? null,
          linkedin_created_at: publishedAt,
          published_at: publishedAt,
          linkedin_last_modified_at: lastModifiedAt,
          sync_source: source,
          sync_confidence: "VERIFIED",
          last_synced_at: observedAt,
          metrics_status: hasAnyMetric ? "VERIFIED — LINKEDIN ORGANIC" : "UNAVAILABLE FROM SOURCE",
          metrics_observed_at: hasAnyMetric ? observedAt : null,
          linkedin_metrics: hasAnyMetric ? normalizedMetrics : {},
          linkedin_response_summary: hasAnyMetric
            ? "Verifierad LinkedIn Organic-observation. Endast mätvärden som källan returnerade är sparade; saknade värden är NULL."
            : "LinkedIn-posten är verifierad men källan returnerade inga användbara engagement-mätvärden i denna observation.",
          updated_at: observedAt,
        };

        let socialPostId: string;
        if (existing) {
          const { data: row, error } = await db
            .from("social_posts")
            .update(patch)
            .eq("id", existing.id)
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          socialPostId = row.id;
          updated += 1;
        } else {
          const { data: row, error } = await db
            .from("social_posts")
            .insert({
              ...patch,
              objective: "LinkedIn history sync",
              audience: "LinkedIn",
              campaign: "LinkedIn Organic",
              aspect_ratio: "1:1",
              tags: ["linkedin", "synced", "parkkey"],
              history_key: `linkedin:${postId}`,
              created_by: context.userId,
              created_at: publishedAt ?? observedAt,
            })
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          socialPostId = row.id;
          inserted += 1;
        }

        const { error: observationError } = await db
          .from("linkedin_post_observations")
          .insert({
            sync_run_id: run.id,
            social_post_id: socialPostId,
            linkedin_post_id: postId,
            observed_at: observedAt,
            published_at: publishedAt,
            reactions: normalizedMetrics?.reactions ?? null,
            comments: normalizedMetrics?.comments ?? null,
            reposts: normalizedMetrics?.reposts ?? null,
            impressions: normalizedMetrics?.impressions ?? null,
            clicks: normalizedMetrics?.clicks ?? null,
            engagement_rate: normalizedMetrics?.engagement_rate ?? null,
            metrics: hasAnyMetric ? normalizedMetrics : {},
            raw_summary: incoming.raw_summary ?? {},
          });
        if (observationError) throw new Error(observationError.message);
        if (hasAnyMetric) metricsUpdated += 1;
      }

      const completedAt = new Date().toISOString();
      const { error: finishError } = await db
        .from("linkedin_sync_runs")
        .update({
          completed_at: completedAt,
          status: warnings > 0 ? "COMPLETED_WITH_WARNINGS" : "COMPLETED",
          posts_inserted: inserted,
          posts_updated: updated,
          metrics_updated: metricsUpdated,
          warnings,
          updated_at: completedAt,
        })
        .eq("id", run.id);
      if (finishError) throw new Error(finishError.message);

      await logAudit(
        context.db,
        context,
        "linkedin.history.sync",
        { type: "linkedin_sync_run", id: run.id },
        {
          source,
          account_id: data.account_id ?? null,
          posts_seen: data.posts.length,
          inserted,
          updated,
          metrics_updated: metricsUpdated,
          warnings,
        },
      );

      return {
        ok: true,
        runId: run.id,
        postsSeen: data.posts.length,
        inserted,
        updated,
        metricsUpdated,
        warnings,
      };
    } catch (error) {
      const failedAt = new Date().toISOString();
      await db
        .from("linkedin_sync_runs")
        .update({
          completed_at: failedAt,
          status: "FAILED",
          posts_inserted: inserted,
          posts_updated: updated,
          metrics_updated: metricsUpdated,
          warnings,
          error_message: error instanceof Error ? error.message : "Okänt synkfel",
          updated_at: failedAt,
        })
        .eq("id", run.id);
      throw error;
    }
  });
