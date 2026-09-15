import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { getLinkedInCapabilityFromCoreos } from "./linkedin-capability";
import { getLinkedInRuntimeReadiness } from "./linkedin.server";
import { getReplicateRuntimeReadiness, verifyReplicateAccount } from "./replicate.server";

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

async function verifyCoreosBridge(context: { db: any }) {
  const [members, films, media, social] = await Promise.all([
    context.db.from("team_members").select("id", { count: "exact", head: true }).eq("status", "approved"),
    context.db.from("film_projects").select("id", { count: "exact", head: true }),
    context.db.from("media_assets").select("id", { count: "exact", head: true }),
    context.db.from("social_posts").select("id", { count: "exact", head: true }),
  ]);

  const firstError = [members.error, films.error, media.error, social.error].find(Boolean);
  if (firstError) {
    return {
      status: "FAILED",
      notes: `Gemensamma CoreOS-backenden kunde inte verifieras: ${firstError.message}`,
    };
  }

  return {
    status: "CONNECTED",
    notes: `Verifierad gemensam CoreOS-backend: ${members.count ?? 0} godkända teammedlemmar, ${films.count ?? 0} filmprojekt, ${media.count ?? 0} media-assets och ${social.count ?? 0} sociala poster. Samma RLS/team_members används i Studio och CoreOS.`,
  };
}

/**
 * Truth-safe integration verification. CONNECTED is only emitted when the
 * canonical/provider record is verified and the production runtime has the
 * corresponding server-side transport configured.
 */
export const verifyIntegration = createServerFn({ method: "POST" })
  .middleware([requireParkkeyAuth])
  .validator((d: { provider: string }) => d)
  .handler(async ({ data, context }) => {
    const provider = data.provider;
    let status = "NOT CONNECTED";
    let notes = "Ingen verifierad anslutning hittades i serverns miljö.";

    if (provider === "coreos-bridge") {
      const result = await verifyCoreosBridge(context);
      status = result.status;
      notes = result.notes;
    } else if (provider === "manual-upload") {
      status = "CONFIGURED";
      notes =
        "Manuell uppladdning kräver ingen extern provider. Anslutningen är konfigurerad; READY/APPROVED sätts först när en verklig fil eller URL finns och QA har verifierats.";
    } else if (provider === "coreos-delivery") {
      status = "NOT CONNECTED";
      notes =
        "Film Studio förbereder leveranspaket, men externt kundutskick sker endast via CoreOS kommunikationsflöde efter uttrycklig användaråtgärd. Ingen automatisk sändtransport aktiveras här.";
    } else if (provider === "adobe-firefly") {
      status = "NOT CONNECTED";
      notes =
        "Ingen verifierad Adobe Firefly-servertransport finns i Film Studio Worker. Adobe kan användas i produktionen, men CONNECTED kräver en testad server-side integration.";
    } else if (provider === "linkedin") {
      const capability = await getLinkedInCapabilityFromCoreos(context.coreos);
      const runtime = getLinkedInRuntimeReadiness();

      if (capability.publishCapable && runtime.configured) {
        status = "CONNECTED";
        notes = `CoreOS har verifierat LinkedIn-identitet, publiceringssyfte och ${capability.requiredPublishScope ?? "nödvändig write-scope"}. Direct Posts API transport är konfigurerad server-side (API ${runtime.apiVersion}).`;
      } else if (capability.state === "FAILED") {
        status = "FAILED";
        notes = capability.note;
      } else if (capability.publishCapable && !runtime.configured) {
        status = "MANUAL CHECK";
        notes = runtime.oauthAppConfigured
          ? "CoreOS har verifierat LinkedIn-kapaciteten och OAuth-appens serverinställningar finns, men produktion saknar LINKEDIN_ACCESS_TOKEN. Slutför LinkedIns OAuth-consent för rätt konto och lagra token server-side innan publicering kan aktiveras."
          : `CoreOS har verifierat LinkedIn-kapaciteten, men OAuth-runtime är inte färdig. ${runtime.note}`;
      } else {
        status = capability.state;
        notes = `${capability.note} ${runtime.note}`;
      }
    } else if (provider === "video-renderer") {
      const runtime = getReplicateRuntimeReadiness();
      if (!runtime.configured) {
        status = "NOT CONNECTED";
        notes = `${runtime.note} Modell: ${runtime.model}.`;
      } else {
        const verification = await verifyReplicateAccount();
        if (verification.ok) {
          status = "CONNECTED";
          notes = `${verification.note} MP4-output accepteras endast från replicate.delivery-allowlisten och verifieras fortfarande via HTTPS + content-type innan READY.`;
        } else {
          status = verification.status >= 400 ? "FAILED" : "MANUAL CHECK";
          notes = verification.note;
        }
      }
    } else if (provider === "image-generation") {
      const lovableKey = process.env["LOVABLE_API_KEY"];
      if (!lovableKey) {
        notes =
          "Ingen verifierad AI-nyckel i Film Studio Workers servermiljö. Workspace-tillgång räcker inte för att markera runtime CONNECTED.";
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

    const verified = status === "CONNECTED" || status === "CONFIGURED";
    const { data: row, error } = await context.db
      .from("integration_connections")
      .update({
        status,
        notes,
        verified_at: verified ? new Date().toISOString() : null,
      })
      .eq("provider", provider)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { connection: row, status, notes };
  });
