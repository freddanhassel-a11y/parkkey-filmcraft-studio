export const APPROVAL_STATES = [
  "DRAFT",
  "INTERNAL REVIEW",
  "APPROVED",
  "SCHEDULED",
  "READY TO SEND",
  "PUBLISHED",
  "SENT",
  "FAILED",
] as const;

export type ApprovalState = (typeof APPROVAL_STATES)[number];

const TRANSITIONS: Record<ApprovalState, readonly ApprovalState[]> = {
  DRAFT: ["INTERNAL REVIEW"],
  "INTERNAL REVIEW": ["DRAFT", "APPROVED", "FAILED"],
  APPROVED: ["DRAFT", "SCHEDULED", "READY TO SEND", "FAILED"],
  SCHEDULED: ["APPROVED", "PUBLISHED", "FAILED"],
  "READY TO SEND": ["APPROVED", "SENT", "FAILED"],
  PUBLISHED: [],
  SENT: [],
  FAILED: ["DRAFT", "INTERNAL REVIEW", "APPROVED"],
};

/** Map legacy Phase-1 status names without changing historical database rows. */
export function canonicalApprovalState(status: string): ApprovalState | null {
  const normalized = status.trim().toUpperCase();
  if (normalized === "REVIEW") return "INTERNAL REVIEW";
  if (normalized === "SCHEDULED — CONNECTION REQUIRED") return "SCHEDULED";
  if (normalized === "READY TO SEND IN COREOS") return "READY TO SEND";
  return APPROVAL_STATES.find((state) => state === normalized) ?? null;
}

export function canTransitionApproval(from: string, to: ApprovalState) {
  const canonicalFrom = canonicalApprovalState(from);
  if (!canonicalFrom) return false;
  return TRANSITIONS[canonicalFrom].includes(to);
}

export function assertApprovalTransition(from: string, to: ApprovalState) {
  if (!canTransitionApproval(from, to)) {
    throw new Error(`Otillåten statusövergång: ${from} → ${to}.`);
  }
}

export function isApprovedForExternalUse(status: string) {
  const state = canonicalApprovalState(status);
  return state === "APPROVED" || state === "SCHEDULED" || state === "READY TO SEND";
}
