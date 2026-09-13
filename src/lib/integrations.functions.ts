import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";

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
 * Sanningskontroll av anslutningar. Statusen sätts bara av en verklig kontroll —
 * finns ingen nyckel i serverns miljö blir svaret NOT CONNECTED.
 */
export const verifyIntegration = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .inputValidator((d: { provider: string }) => d)
  .handler(async ({ data, context }) => {
    const provider = data.provider;
    let status = "NOT CONNECTED";
    let notes = "Ingen anslutning hittades i serverns miljö.";

    if (provider === "linkedin") {
      const lovableKey = process.env["LOVABLE_API_KEY"];
      const linkedinKey = process.env["LINKEDIN_API_KEY"];
      if (!linkedinKey) {
        notes =
          "LinkedIn-anslutningen saknas. En administratör måste ansluta LinkedIn med rättigheten w_member_social innan publicering kan aktiveras.";
      } else if (!lovableKey) {
        notes = "LinkedIn-nyckel finns men ParkKeys API-nyckel saknas i serverns miljö.";
      } else {
        try {
          const res = await fetch(
            "https://connector-gateway.lovable.dev/api/v1/verify_credentials",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${lovableKey}`,
                "X-Connection-Api-Key": linkedinKey,
              },
            },
          );
          const body = await res.text();
          if (res.ok && body.includes("verified")) {
            status = "CONNECTED";
            notes = "Anslutningen verifierad mot LinkedIn.";
          } else {
            notes = `Verifieringen misslyckades (${res.status}): ${body.slice(0, 300)}`;
          }
        } catch (error) {
          notes = `Verifieringen kunde inte genomföras: ${error instanceof Error ? error.message : "okänt fel"}`;
        }
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
        "Ingen automatisk kontroll finns för den här leverantören. Status sätts manuellt av administratör.";
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
