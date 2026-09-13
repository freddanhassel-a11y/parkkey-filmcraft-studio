import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { getLinkedInCapabilityFromCoreos } from "./linkedin-capability";

export const getLinkedInCapability = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => getLinkedInCapabilityFromCoreos(context.coreos));
