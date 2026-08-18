import type { ApplicationStatus } from "../../../types";

/** The four Admin decision actions, as surfaced by the review action bar. */
export type ReviewAction =
  | "approve"
  | "reject"
  | "request-documents"
  | "back-to-review";

/**
 * Status → actions the backend will accept right now. Derived, never stored:
 * the action bar always re-derives from fresh status after a decision or a
 * 409 (another admin decided first).
 *
 * `Submitted` maps to no action — the screen shows an "open for review"
 * affordance instead, because the review GET itself performs the claim
 * (Submitted → UnderReview).
 */
export function deriveAllowedActions(
  status: ApplicationStatus,
): ReviewAction[] {
  switch (status) {
    case "UnderReview":
      return ["approve", "reject", "request-documents"];
    case "WaitingForDocuments":
      return ["back-to-review"];
    default:
      return [];
  }
}

/** True when the only remaining move is claiming a Submitted application. */
export function isClaimable(status: ApplicationStatus): boolean {
  return status === "Submitted";
}
