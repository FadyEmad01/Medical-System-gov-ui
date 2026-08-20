import type { ApplicationStatus } from "../../types";

/**
 * Whether a status's tracking panel renders application detail data. Only the
 * submitted/under-review (review summary), waiting-documents (reviewer note)
 * and rejected (decision reason) panels read it; draft, approved and cancelled
 * panels never do.
 */
export function panelNeedsApplicationDetail(
  status: ApplicationStatus | null | undefined,
): boolean {
  return (
    status === "Submitted" ||
    status === "UnderReview" ||
    status === "WaitingForDocuments" ||
    status === "Rejected"
  );
}
