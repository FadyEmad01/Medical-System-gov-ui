import type { ApplicationStatus } from "../types";

/**
 * Application status → badge tone built from the semantic status tokens.
 * Shared by the citizen tracking page and the admin review queue so both
 * surfaces speak the same color vocabulary.
 */
export const APPLICATION_STATUS_TONE: Record<ApplicationStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Submitted: "bg-info/10 text-info",
  UnderReview: "bg-info/10 text-info",
  WaitingForDocuments: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-revoked/10 text-revoked",
  Cancelled: "bg-muted text-muted-foreground",
};
