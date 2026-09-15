/* eslint-disable @typescript-eslint/no-explicit-any, prettier/prettier */
import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";

export const getLinkedInHistoryDashboard = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const db = context.db as any;
    const [pipeline, runs, weekly] = await Promise.all([
      db
        .from("social_post_pipeline")
        .select("*")
        .order("display_date", { ascending: false, nullsFirst: false }),
      db.from("linkedin_sync_runs").select("*").order("started_at", { ascending: false }).limit(20),
      db.from("linkedin_weekly_analytics").select("*").order("period_start", { ascending: false }),
    ]);

    if (pipeline.error) throw new Error(pipeline.error.message);
    if (runs.error) throw new Error(runs.error.message);
    if (weekly.error) throw new Error(weekly.error.message);

    const posts = pipeline.data ?? [];
    const count = (status: string) => posts.filter((post: any) => post.pipeline_status === status).length;
    const verifiedPublished = posts.filter(
      (post: any) =>
        post.pipeline_status === "PUBLISHED" &&
        (post.linkedin_post_id || post.linkedin_permalink || post.source_post_url),
    );
    const assetOnly = posts.filter((post: any) => post.sync_confidence === "ASSET_ONLY");
    const impressions = (weekly.data ?? []).reduce(
      (sum: number, row: any) =>
        sum + (typeof row.impressions === "number" ? row.impressions : Number(row.impressions ?? 0)),
      0,
    );

    return {
      posts,
      runs: runs.data ?? [],
      weekly: weekly.data ?? [],
      summary: {
        totalRows: posts.length,
        published: count("PUBLISHED"),
        scheduled: count("SCHEDULED"),
        inProgress: count("IN_PROGRESS"),
        notPublished: count("NOT_PUBLISHED"),
        verifiedPosts: verifiedPublished.length,
        assetOnlyRows: assetOnly.length,
        weeklyPeriods: (weekly.data ?? []).length,
        verifiedWeeklyImpressions: impressions,
        latestSync: (runs.data ?? [])[0] ?? null,
      },
    };
  });
