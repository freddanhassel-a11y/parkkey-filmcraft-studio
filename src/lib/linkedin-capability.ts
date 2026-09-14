import type { CoreosClient } from "@/integrations/parkkey/auth-middleware";

export type LinkedInCapabilityState = "CONNECTED" | "NOT CONNECTED" | "MANUAL CHECK" | "FAILED";

export type LinkedInCapability = {
  state: LinkedInCapabilityState;
  publishCapable: boolean;
  purpose: string | null;
  displayName: string | null;
  expectedPrincipal: string | null;
  observedPrincipal: string | null;
  resourceId: string | null;
  grantedScopes: string[];
  requestedScopes: string[];
  requiredPublishScope: string | null;
  missingPublishScope: boolean;
  verifiedAt: string | null;
  note: string;
};

type IntegrationAccount = {
  provider: string;
  purpose: string;
  display_name: string;
  expected_principal: string;
  observed_principal: string | null;
  expected_resource_id: string | null;
  status: string;
  requested_scopes: string[] | null;
  granted_scopes: string[] | null;
  preflight_verified: boolean;
  last_verified_at: string | null;
  last_error: string | null;
  notes: string | null;
};

function disconnected(note: string): LinkedInCapability {
  return {
    state: "NOT CONNECTED",
    publishCapable: false,
    purpose: null,
    displayName: null,
    expectedPrincipal: null,
    observedPrincipal: null,
    resourceId: null,
    grantedScopes: [],
    requestedScopes: [],
    requiredPublishScope: null,
    missingPublishScope: true,
    verifiedAt: null,
    note,
  };
}

function requiredWriteScope(row: IntegrationAccount): "w_member_social" | "w_organization_social" {
  const principal = (row.observed_principal || row.expected_principal || "").toLowerCase();
  const resource = (row.expected_resource_id || "").toLowerCase();
  if (principal.startsWith("urn:li:organization:") || resource.startsWith("urn:li:organization:")) {
    return "w_organization_social";
  }
  return "w_member_social";
}

/**
 * Reads CoreOS' canonical integration truth model. No OAuth token or secret is
 * copied into Film Studio. Publishing is fail-closed: an otherwise verified
 * account must also have the LinkedIn write scope that matches its author type.
 */
export async function getLinkedInCapabilityFromCoreos(
  coreos: CoreosClient,
): Promise<LinkedInCapability> {
  const result = await coreos
    .from("integration_accounts")
    .select(
      "provider,purpose,display_name,expected_principal,observed_principal,expected_resource_id,status,requested_scopes,granted_scopes,preflight_verified,last_verified_at,last_error,notes",
    )
    .ilike("provider", "%linkedin%")
    .order("last_verified_at", { ascending: false, nullsFirst: false })
    .limit(10);

  if (result.error) {
    const denied =
      result.error.code === "42501" || /permission|policy|rls/i.test(result.error.message);
    return {
      ...disconnected(
        denied
          ? "LinkedIn-kapaciteten kan inte läsas med nuvarande CoreOS-behörighet. Manuell admin-kontroll krävs."
          : `CoreOS kunde inte verifiera LinkedIn: ${result.error.message}`,
      ),
      state: denied ? "MANUAL CHECK" : "FAILED",
    };
  }

  const rows = (result.data ?? []) as IntegrationAccount[];
  if (rows.length === 0)
    return disconnected("Ingen LinkedIn-integration finns registrerad i CoreOS.");

  const row = rows.find((candidate) => candidate.status.toLowerCase() === "connected") ?? rows[0];
  if (!row) return disconnected("Ingen LinkedIn-integration finns registrerad i CoreOS.");

  const grantedScopes = row.granted_scopes ?? [];
  const requestedScopes = row.requested_scopes ?? [];
  const requiredPublishScope = requiredWriteScope(row);
  const hasPublishScope = grantedScopes.some(
    (scope) => scope.trim().toLowerCase() === requiredPublishScope,
  );
  const principalMatches =
    Boolean(row.observed_principal) &&
    row.observed_principal?.toLowerCase() === row.expected_principal.toLowerCase();
  const verifiedConnection =
    row.status.toLowerCase() === "connected" &&
    row.preflight_verified === true &&
    Boolean(row.last_verified_at) &&
    principalMatches &&
    hasPublishScope;
  const purpose = row.purpose.toLowerCase();
  const publishingIntent = purpose.includes("publish") || purpose.includes("social");

  let state: LinkedInCapabilityState = "NOT CONNECTED";
  let note = row.notes ?? "LinkedIn är inte verifierat för publicering.";
  if (["error", "mismatch", "revoked"].includes(row.status.toLowerCase())) {
    state = "FAILED";
    note = row.last_error ?? row.notes ?? `CoreOS-status: ${row.status}`;
  } else if (!hasPublishScope && row.status.toLowerCase() === "connected") {
    state = "MANUAL CHECK";
    note = `LinkedIn-kontot är anslutet men saknar nödvändig publiceringsrättighet ${requiredPublishScope}.`;
  } else if (verifiedConnection && publishingIntent) {
    state = "CONNECTED";
    note = `CoreOS har verifierat kontoidentitet, preflight och ${requiredPublishScope} för en publiceringsavsedd LinkedIn-integration.`;
  } else if (verifiedConnection) {
    state = "MANUAL CHECK";
    note =
      "LinkedIn-kontot är verifierat i CoreOS, men integrationssyftet är inte uttryckligen publicering/socialt flöde.";
  } else if (row.status.toLowerCase() !== "setup_required") {
    state = "MANUAL CHECK";
    note = row.last_error ?? row.notes ?? "LinkedIn-integrationen kräver verifiering i CoreOS.";
  }

  return {
    state,
    publishCapable: state === "CONNECTED",
    purpose: row.purpose,
    displayName: row.display_name,
    expectedPrincipal: row.expected_principal,
    observedPrincipal: row.observed_principal,
    resourceId: row.expected_resource_id,
    grantedScopes,
    requestedScopes,
    requiredPublishScope,
    missingPublishScope: !hasPublishScope,
    verifiedAt: row.last_verified_at,
    note,
  };
}
