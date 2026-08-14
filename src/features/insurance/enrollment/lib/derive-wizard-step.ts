import type { ApplicationStatus } from "../../types";
import type { EnrollmentReadinessResponseDto } from "../types";

export type WizardStep =
  | "eligibility"
  | "profile"
  | "documents"
  | "dependents"
  | "review";

export type TrackingPanel =
  | "draft"
  | "submitted"
  | "under-review"
  | "waiting-documents"
  | "approved"
  | "rejected"
  | "cancelled";

/**
 * Picks the wizard step to resume from. Returns the first step that is not
 * complete, in the order the wizard runs, so a returning patient never
 * repeats finished sections.
 */
export function deriveInitialWizardStep(
  readiness: EnrollmentReadinessResponseDto,
): WizardStep {
  if (
    !readiness.isEligibleForCategory ||
    readiness.eligibilityViolations.length > 0
  ) {
    return "eligibility";
  }

  if (!readiness.profileComplete) return "profile";

  if (!readiness.documentsComplete) return "documents";

  if (!readiness.dependentsValid) return "dependents";

  return "review";
}

/** Maps an application status to its tracking panel (one-to-one). */
export function deriveTrackingPanel(status: ApplicationStatus): TrackingPanel {
  switch (status) {
    case "Draft":
      return "draft";
    case "Submitted":
      return "submitted";
    case "UnderReview":
      return "under-review";
    case "WaitingForDocuments":
      return "waiting-documents";
    case "Approved":
      return "approved";
    case "Rejected":
      return "rejected";
    case "Cancelled":
      return "cancelled";
  }
}
