import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";
import { getLinkedInRuntimeReadiness } from "./linkedin.server";

export type ReadinessState = "CONNECTED" | "NOT CONNECTED" | "DEGRADED" | "MANUAL CHECK" | "FAILED";

export type ProductionReadinessItem = {
  key: "coreos" | "image-ai" | "linkedin" | "video-renderer" | "customer-delivery";
  label: string;
  state: ReadinessState;
  note: string;
  verifiedAt: string | null;
};

type ConnectionRow = {
  provider: string;
  status: string;
  notes: string | null;
  verified_at: string | null;
};

const VERIFICATION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1000;

function verificationAgeState(value: string | null): "fresh" | "stale" | "invalid" | "missing" {
  if (!value) return "missing";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "invalid";
  const age = Date.now() - timestamp;
  if (age < -FUTURE_CLOCK_SKEW_MS) return "invalid";
  return age > VERIFICATION_MAX_AGE_MS ? "stale" : "fresh";
}

function verifiedConnection(
  row: ConnectionRow | undefined,
  label: string,
  key: ProductionReadinessItem["key"],
): ProductionReadinessItem {
  if (!row) {
    return {
      key,
      label,
      state: "NOT CONNECTED",
      note: "Ingen verifierad anslutning är registrerad.",
      verifiedAt: null,
    };
  }

  const status = row.status.toUpperCase();
  if (status === "FAILED" || status === "ERROR") {
    return {
      key,
      label,
      state: "FAILED",
      note: row.notes ?? "Senaste anslutningskontrollen misslyckades.",
      verifiedAt: row.verified_at,
    };
  }
  if (status === "DEGRADED") {
    return {
      key,
      label,
      state: "DEGRADED",
      note: row.notes ?? "Anslutningen fungerar delvis.",
      verifiedAt: row.verified_at,
    };
  }
  if (status === "CONNECTED") {
    const ageState = verificationAgeState(row.verified_at);
    if (ageState === "fresh") {
      return {
        key,
        label,
        state: "CONNECTED",
        note: row.notes ?? "Verifierad anslutning.",
        verifiedAt: row.verified_at,
      };
    }
    return {
      key,
      label,
      state: "MANUAL CHECK",
      note:
        ageState === "stale"
          ? "Anslutningen var verifierad, men beviset är äldre än 24 timmar och måste verifieras igen."
          : ageState === "invalid"
            ? "Anslutningen har en ogiltig verifieringstid och måste verifieras igen."
            : "Anslutningen är markerad som ansluten men saknar verifieringstid.",
      verifiedAt: row.verified_at,
    };
  }
  if (status === "MANUAL CHECK") {
    return {
      key,
      label,
      state: "MANUAL CHECK",
      note: row.notes ?? "Manuell verifiering krävs.",
      verifiedAt: row.verified_at,
    };
  }
  return {
    key,
    label,
    state: "NOT CONNECTED",
    note: row.notes ?? "Ingen verifierad anslutning.",
    verifiedAt: row.verified_at,
  };
}

function applyLinkedInRuntimeEvidence(item: ProductionReadinessItem): ProductionReadinessItem {
  if (item.state !== "CONNECTED") return item;
  const runtime = getLinkedInRuntimeReadiness();
  if (runtime.configured) return item;
  return {
    ...item,
    state: "MANUAL CHECK",
    note: `CoreOS-bevis finns, men produktionens LinkedIn-transport är inte komplett: ${runtime.note}`,
  };
}

function applyVideoSecurityEvidence(item: ProductionReadinessItem): ProductionReadinessItem {
  if (item.state !== "CONNECTED") return item;
  const allowedHosts = (process.env["VIDEO_RENDER_ALLOWED_HOSTS"] ?? "").trim();
  if (allowedHosts) return item;
  return {
    ...item,
    state: "MANUAL CHECK",
    note: "Videorenderaren är verifierad, men VIDEO_RENDER_ALLOWED_HOSTS saknas. Externa renderfiler blockeras fail-closed tills en server-side hostlista är konfigurerad.",
  };
}

export const getProductionReadiness = createServerFn({ method: "GET" })
  .middleware([requireParkkeyAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.db
      .from("integration_connections")
      .select("provider,status,notes,verified_at");
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as ConnectionRow[];
    const byProvider = new Map(rows.map((row) => [row.provider, row]));

    // Reaching this handler already proves the current user token and approved
    // team membership against canonical CoreOS. This is stronger evidence than
    // the legacy seeded integration row.
    const coreos: ProductionReadinessItem = {
      key: "coreos",
      label: "CoreOS",
      state: "CONNECTED",
      note: "Aktuell session verifierad mot ParkKey/CoreOS och godkänd teammedlem.",
      verifiedAt: new Date().toISOString(),
    };

    const linkedin = applyLinkedInRuntimeEvidence(
      verifiedConnection(byProvider.get("linkedin"), "LinkedIn", "linkedin"),
    );
    const videoRenderer = applyVideoSecurityEvidence(
      verifiedConnection(byProvider.get("video-renderer"), "Video Renderer", "video-renderer"),
    );

    const items: ProductionReadinessItem[] = [
      coreos,
      verifiedConnection(byProvider.get("image-generation"), "Image AI", "image-ai"),
      linkedin,
      videoRenderer,
      verifiedConnection(
        byProvider.get("coreos-delivery"),
        "Customer Delivery",
        "customer-delivery",
      ),
    ];

    return {
      items,
      checkedAt: new Date().toISOString(),
      verificationMaxAgeHours: VERIFICATION_MAX_AGE_MS / (60 * 60 * 1000),
    };
  });
