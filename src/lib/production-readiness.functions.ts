import { createServerFn } from "@tanstack/react-start";

import { requireParkkeyAuth } from "@/integrations/parkkey/auth-middleware";

export type ReadinessState =
  | "CONNECTED"
  | "NOT CONNECTED"
  | "DEGRADED"
  | "MANUAL CHECK"
  | "FAILED";

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
  if (status === "FAILED") {
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
  if (status === "CONNECTED" && row.verified_at) {
    return {
      key,
      label,
      state: "CONNECTED",
      note: row.notes ?? "Verifierad anslutning.",
      verifiedAt: row.verified_at,
    };
  }
  if (status === "CONNECTED" && !row.verified_at) {
    return {
      key,
      label,
      state: "MANUAL CHECK",
      note: "Anslutningen är markerad som ansluten men saknar verifieringstid.",
      verifiedAt: null,
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

    const items: ProductionReadinessItem[] = [
      coreos,
      verifiedConnection(byProvider.get("image-generation"), "Image AI", "image-ai"),
      verifiedConnection(byProvider.get("linkedin"), "LinkedIn", "linkedin"),
      verifiedConnection(byProvider.get("video-renderer"), "Video Renderer", "video-renderer"),
      verifiedConnection(byProvider.get("coreos-delivery"), "Customer Delivery", "customer-delivery"),
    ];

    return { items, checkedAt: new Date().toISOString() };
  });
