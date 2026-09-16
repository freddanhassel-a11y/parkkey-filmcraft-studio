import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { reconcileSuppliedAutumnManifest } from "./linkedin-autumn-manifest-reconcile";
import { ensureLinkedInAutumnSeries2026 } from "./linkedin-autumn-series";

export const ensureLinkedInAutumnSeries2026Fn = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const seeded = await ensureLinkedInAutumnSeries2026(context.db, context.userId);
    const reconciled = await reconcileSuppliedAutumnManifest(context.db);
    return { ...seeded, ...reconciled };
  });
