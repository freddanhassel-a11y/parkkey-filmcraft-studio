import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { getLinkedInCapabilityFromCoreos } from "./linkedin-capability";
import { getLinkedInRuntimeReadiness } from "./linkedin.server";

export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const [legacy, connections] = await Promise.all([
      context.db.from("integrations").select("*").order("display_name"),
      context.db.from("integration_connections").select("*").order("display_name"),
    ]);
    if (connections.error) throw new Error(connections.error.message);
    return { legacy: legacy.data ?? [], connections: connections.data ?? [] };
  });

/**
 * Truth-safe integration verification. CONNECTED is only emitted when the
 * canonical CoreOS integration record is verified and the production runtime
 * has the corresponding server-side transport configured.
 */
export const verifyIntegration = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator((d: { provider: string }) => d)
  .handler(async ({ data, context }) => {
    const provider = data.provider;
    let status = "NOT CONNECTED";
    let notes = "Ingen verifierad anslutning hittades i serverns miljö.";

    if (provider === "linkedin") {
      const capability = await getLinkedInCapabilityFromCoreos(context.coreos);
      const runtime = getLinkedInRuntimeReadiness();

      if (capability.publishCapable && runtime.configured) {
        status = "CONNECTED";
        notes = `CoreOS har verifierat LinkedIn-identitet, publiceringssyfte och beviljade capabilities. Direct Posts API transport är konfigurerad server-side (API ${runtime.apiVersion}).`;
      } else if (capability.state === "FAILED") {
        status = "FAILED";
        notes = capability.note;
      } else if (capability.publishCapable && !runtime.configured) {
        status = "MANUAL CHECK";
        notes =
          "CoreOS har verifierat LinkedIn-kapaciteten, men produktion saknar LINKEDIN_ACCESS_TOKEN. LinkedIns OAuth-consent måste slutföras och token lagras server-side innan publicering kan aktiveras.";
      } else {
        status = capability.state;
        notes = `${capability.note} ${runtime.note}`;
      }
    } else if (provider === "image-generation") {
      const lovableKey = process.env["LOVABLE_API_KEY"];
      if (!lovableKey) {
        notes = "Ingen AI-nyckel i serverns miljö — bildgenerering kan inte aktiveras.";
      } else {
        try {
          const res = await fetch("https://ai.gateway.lovable.dev/v1/models", {
            headers: { Authorization: `Bearer ${lovableKey}` },
          });
          const body = await res.text();
          if (res.ok && body.includes("gemini-3-pro-image")) {
            status = "CONNECTED";
            notes =
              "Verifierad mot ParkKeys AI-anslutning. Bildgenerering är aktiv i Social Creative Studio (modell google/gemini-3-pro-image).";
          } else {
            notes = `Verifieringen misslyckades (${res.status}): ${body.slice(0, 300)}`;
          }
        } catch (error) {
          notes = `Verifieringen kunde inte genomföras: ${error instanceof Error ? error.message : "okänt fel"}`;
        }
      }
    } else {
      notes =
        "Ingen automatisk kontroll finns för den här leverantören. Status kräver manuell verifiering.";
    }

    const { data: row, error } = await context.db
      .from("integration_connections")
      .update({
        status,
        notes,
        verified_at: status === "CONNECTED" ? new Date().toISOString() : null,
      })
      .eq("provider", provider)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { connection: row, status, notes };
  });
