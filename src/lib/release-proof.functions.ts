import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { getLinkedInCapabilityFromCoreos } from "./linkedin-capability";

export type ReleaseProofState = "PASS" | "FAIL" | "MANUAL";

export type ReleaseProofItem = {
  id: string;
  area: string;
  label: string;
  state: ReleaseProofState;
  evidence: string;
  checkedAt: string;
};

type IntegrationRow = {
  provider: string;
  status: string;
  verified_at: string | null;
  notes: string | null;
};

function item(
  checkedAt: string,
  id: string,
  area: string,
  label: string,
  state: ReleaseProofState,
  evidence: string,
): ReleaseProofItem {
  return { id, area, label, state, evidence, checkedAt };
}

export const getReleaseProof = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const checkedAt = new Date().toISOString();

    const [
      mediaAssets,
      mediaVersions,
      materialLinks,
      auditEvents,
      socialPosts,
      socialSchedules,
      deliveryPackages,
      deliveryRecipients,
      renders,
      qaChecklists,
      integrations,
      firstFilm,
      bucket,
      mediaSample,
    ] = await Promise.all([
      context.db.from("media_assets").select("id", { count: "exact", head: true }),
      context.db.from("media_versions").select("id", { count: "exact", head: true }),
      context.db.from("coreos_material_links").select("id", { count: "exact", head: true }),
      context.db.from("audit_events").select("id", { count: "exact", head: true }),
      context.db.from("social_posts").select("id", { count: "exact", head: true }),
      context.db.from("social_schedules").select("id", { count: "exact", head: true }),
      context.db.from("delivery_packages").select("id", { count: "exact", head: true }),
      context.db.from("delivery_recipients").select("id", { count: "exact", head: true }),
      context.db.from("renders").select("id", { count: "exact", head: true }),
      context.db.from("qa_checklists").select("id", { count: "exact", head: true }),
      context.db.from("integration_connections").select("provider,status,verified_at,notes"),
      context.db
        .from("film_projects")
        .select("id,title,status,truth_label")
        .eq("title", "Parky-testet — AAA/Guldägget master")
        .maybeSingle(),
      context.db.storage.getBucket("studio-media"),
      context.db
        .from("media_assets")
        .select("id,storage_path")
        .is("archived_at", null)
        .not("storage_path", "is", null)
        .limit(1)
        .maybeSingle(),
    ]);

    const tableChecks = [
      ["media_assets", mediaAssets.error],
      ["media_versions", mediaVersions.error],
      ["coreos_material_links", materialLinks.error],
      ["audit_events", auditEvents.error],
      ["social_posts", socialPosts.error],
      ["social_schedules", socialSchedules.error],
      ["delivery_packages", deliveryPackages.error],
      ["delivery_recipients", deliveryRecipients.error],
      ["renders", renders.error],
      ["qa_checklists", qaChecklists.error],
      ["integration_connections", integrations.error],
    ] as const;
    const tableFailures = tableChecks.filter(([, error]) => Boolean(error));

    const items: ReleaseProofItem[] = [
      item(
        checkedAt,
        "auth-boundary",
        "Auth & Security",
        "Delad ParkKey/CoreOS-session",
        "PASS",
        `Denna kontroll nåddes först efter serververifierad bearer-session och godkänd CoreOS-teammedlem (${context.email}).`,
      ),
      item(
        checkedAt,
        "server-data-boundary",
        "Auth & Security",
        "Server-only produktionsdata",
        tableFailures.length === 0 ? "PASS" : "FAIL",
        tableFailures.length === 0
          ? "Alla kritiska Film Studio-tabeller kunde läsas genom den autentiserade servergränsen."
          : `Tabellkontroller misslyckades: ${tableFailures.map(([name]) => name).join(", ")}.`,
      ),
    ];

    const bucketPrivate = !bucket.error && bucket.data?.public === false;
    items.push(
      item(
        checkedAt,
        "private-media-bucket",
        "Media",
        "Privat studio-media bucket",
        bucketPrivate ? "PASS" : "FAIL",
        bucket.error
          ? `Bucket-kontrollen misslyckades: ${bucket.error.message}`
          : bucketPrivate
            ? "studio-media finns och är markerad som privat."
            : "studio-media kunde inte verifieras som privat.",
      ),
    );

    if (mediaSample.error) {
      items.push(
        item(
          checkedAt,
          "signed-media-link",
          "Media",
          "Signerad förhandsvisningslänk",
          "FAIL",
          `Kunde inte läsa ett mediaexempel: ${mediaSample.error.message}`,
        ),
      );
    } else if (!mediaSample.data?.storage_path) {
      items.push(
        item(
          checkedAt,
          "signed-media-link",
          "Media",
          "Signerad förhandsvisningslänk",
          "MANUAL",
          "Inget aktivt mediaobjekt finns att prova mot. Ladda upp en bild/video för ett verkligt end-to-end-test.",
        ),
      );
    } else {
      const signed = await context.db.storage
        .from("studio-media")
        .createSignedUrl(mediaSample.data.storage_path, 60);
      items.push(
        item(
          checkedAt,
          "signed-media-link",
          "Media",
          "Signerad förhandsvisningslänk",
          signed.error || !signed.data?.signedUrl ? "FAIL" : "PASS",
          signed.error
            ? `Signerad länk kunde inte skapas: ${signed.error.message}`
            : "En verklig privat mediafil fick en tidsbegränsad 60-sekunders signerad länk.",
        ),
      );
    }

    const firstFilmProject = firstFilm.data;
    if (firstFilm.error || !firstFilmProject) {
      items.push(
        item(
          checkedAt,
          "first-film",
          "Film Production",
          "Parky-testet — AAA/Guldägget master",
          "FAIL",
          firstFilm.error
            ? `Projektkontrollen misslyckades: ${firstFilm.error.message}`
            : "Det kanoniska förstaprojektet saknas.",
        ),
      );
    } else {
      const [versions, prompts] = await Promise.all([
        context.db
          .from("film_versions")
          .select("id", { count: "exact", head: true })
          .eq("project_id", firstFilmProject.id),
        context.db
          .from("prompts")
          .select("id", { count: "exact", head: true })
          .eq("project_id", firstFilmProject.id),
      ]);
      const firstFilmHealthy = !versions.error && !prompts.error && (versions.count ?? 0) >= 2;
      items.push(
        item(
          checkedAt,
          "first-film",
          "Film Production",
          "Parky-testet — AAA/Guldägget master",
          firstFilmHealthy ? "PASS" : "FAIL",
          firstFilmHealthy
            ? `${versions.count ?? 0} versioner och ${prompts.count ?? 0} promptdokument verifierades. Status: ${firstFilmProject.status}; truth: ${firstFilmProject.truth_label}.`
            : "Förstaprojektet finns men versioner/promptdata kunde inte verifieras enligt releasekravet.",
        ),
      );
    }

    const rows = (integrations.data ?? []) as IntegrationRow[];
    const imageAi = rows.find((row) => row.provider === "image-generation");
    const imageAiConnected = imageAi?.status === "CONNECTED" && Boolean(imageAi.verified_at);
    items.push(
      item(
        checkedAt,
        "image-ai",
        "Integrations",
        "Image AI",
        imageAiConnected ? "PASS" : "MANUAL",
        imageAiConnected
          ? `Verifierad anslutning ${imageAi.verified_at}. ${imageAi.notes ?? ""}`.trim()
          : "Ingen verifierad Image AI-anslutning med verifieringstid kan bevisas i integrationsregistret.",
      ),
    );

    const linkedin = await getLinkedInCapabilityFromCoreos(context.coreos);
    items.push(
      item(
        checkedAt,
        "linkedin-capability",
        "Integrations",
        "LinkedIn publiceringskapacitet",
        linkedin.publishCapable ? "PASS" : linkedin.state === "FAILED" ? "FAIL" : "MANUAL",
        linkedin.note,
      ),
    );

    const videoRenderer = rows.find((row) => row.provider === "video-renderer");
    const videoConnected =
      videoRenderer?.status === "CONNECTED" && Boolean(videoRenderer.verified_at);
    items.push(
      item(
        checkedAt,
        "video-renderer",
        "Film Production",
        "Video Renderer",
        videoConnected ? "PASS" : "MANUAL",
        videoConnected
          ? `Verifierad videorenderare ${videoRenderer.verified_at}.`
          : "Ingen verifierad renderprovider. UI ska därför fortsätta visa No rendered file yet tills en verklig MP4 verifieras.",
      ),
    );

    items.push(
      item(
        checkedAt,
        "delivery-e2e",
        "Customer Delivery",
        "CoreOS-mottagare → explicit bekräftelse",
        "MANUAL",
        `Datamodellen är åtkomlig (${deliveryPackages.count ?? 0} paket, ${deliveryRecipients.count ?? 0} mottagare), men en riktig kontakt och ett APPROVED-material måste väljas manuellt för end-to-end-verifiering.`,
      ),
      item(
        checkedAt,
        "coreos-writeback-e2e",
        "CoreOS",
        "Materiallänk + writeback",
        "MANUAL",
        `${materialLinks.count ?? 0} materiallänkar finns. Ett verkligt kund/pilot/opportunity-flöde måste fortfarande köras med användarens CoreOS-behörighet för releasebevis.`,
      ),
      item(
        checkedAt,
        "session-expiry-logout",
        "Auth & Security",
        "Session expiry och logout-cache",
        "MANUAL",
        "Klienten rensar nu React Query-cache vid shared ParkKey SIGNED_OUT och ersätter historikposten med /auth. Verifiera även beteendet i en verklig browser-session.",
      ),
      item(
        checkedAt,
        "responsive-keyboard",
        "Accessibility",
        "390 / 768 / 1280 + tangentbord/fokus",
        "MANUAL",
        "Kräver verklig browser-QA; serverdiagnostik kan inte bevisa layout, overflow eller fokusordning.",
      ),
    );

    const summary = {
      pass: items.filter((proof) => proof.state === "PASS").length,
      fail: items.filter((proof) => proof.state === "FAIL").length,
      manual: items.filter((proof) => proof.state === "MANUAL").length,
      total: items.length,
    };

    return {
      checkedAt,
      items,
      summary,
      counts: {
        mediaAssets: mediaAssets.count ?? 0,
        mediaVersions: mediaVersions.count ?? 0,
        auditEvents: auditEvents.count ?? 0,
        socialPosts: socialPosts.count ?? 0,
        socialSchedules: socialSchedules.count ?? 0,
        deliveryPackages: deliveryPackages.count ?? 0,
        renders: renders.count ?? 0,
        qaChecklists: qaChecklists.count ?? 0,
      },
    };
  });
