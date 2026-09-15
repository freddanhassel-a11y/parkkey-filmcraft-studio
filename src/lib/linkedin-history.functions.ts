import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";

export const getLinkedInHistoryDashboard = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const db = context.db as any;
    const [history, runs, weekly] = await Promise.all([
      db
        .from("linkedin_history_feed")
        .select("*")
        .order("verified_published_at", { ascending: false, nullsFirst: false })
        .order("asset_date", { ascending: false, nullsFirst: false }),
      db
        .from("linkedin_sync_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20),
      db
        .from("linkedin_weekly_analytics")
        .select("*")
        .order("week_start", { ascending: false }),
    ]);

    if (history.error) throw new Error(history.error.message);
    if (runs.error) throw new Error(runs.error.message);
    if (weekly.error) throw new Error(weekly.error.message);

    const posts = history.data ?? [];
    const verified = posts.filter((post: any) => post.linkedin_post_id || post.sync_confidence === "VERIFIED");
    const assetOnly = posts.filter((post: any) => !post.linkedin_post_id && post.sync_confidence === "ASSET_ONLY");
    const impressions = (weekly.data ?? []).reduce(
      (sum: number, row: any) => sum + (typeof row.impressions === "number" ? row.impressions : Number(row.impressions ?? 0)),
      0,
    );

    return {
      posts,
      runs: runs.data ?? [],
      weekly: weekly.data ?? [],
      summary: {
        totalRows: posts.length,
        verifiedPosts: verified.length,
        assetOnlyRows: assetOnly.length,
        weeklyPeriods: (weekly.data ?? []).length,
        verifiedWeeklyImpressions: impressions,
        latestSync: (runs.data ?? [])[0] ?? null,
      },
    };
  });
