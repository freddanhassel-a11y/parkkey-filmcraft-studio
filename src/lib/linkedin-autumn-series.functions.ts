import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { ensureLinkedInAutumnSeries2026 } from "./linkedin-autumn-series";

export const ensureLinkedInAutumnSeries2026Fn = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => ensureLinkedInAutumnSeries2026(context.db, context.userId));
