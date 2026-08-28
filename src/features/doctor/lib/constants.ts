/**
 * Clinical domain closed sets, mirroring the integration guide (§6.8, §11).
 * The VisitStatus values and transition rules are contract-confirmed; field
 * limits below are pending the clinical swagger and may need adjusting.
 */

import type { VisitStatus, VisitType } from "../types";

/** §11 state machine: Scheduled → InProgress → Completed, or Scheduled → Cancelled. */
export const VISIT_STATUSES = [
  "Scheduled",
  "InProgress",
  "Completed",
  "Cancelled",
] as const;

export const VISIT_TYPES = ["Consultation", "FollowUp", "Emergency"] as const;

/** Allowed next statuses per current status (re-applying the same status is never valid). */
export const VISIT_TRANSITIONS: Readonly<
  Record<VisitStatus, readonly VisitStatus[]>
> = {
  Scheduled: ["InProgress", "Cancelled"],
  InProgress: ["Completed"],
  Completed: [],
  Cancelled: [],
};

/** Pending clinical swagger — conservative caps until the backend publishes limits. */
export const DIAGNOSIS_MAX = 2000;
export const NOTES_MAX = 5000;
export const REQUIRED_TESTS_MAX = 2000;
export const MEDICINE_NAME_MAX = 200;
export const DOSAGE_MAX = 100;
export const FREQUENCY_MAX = 100;
export const DURATION_MAX = 100;

/** Attachments share the backend validation helper with insurance documents (§10). */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"] as const;

export function isVisitStatus(value: unknown): value is VisitStatus {
  return (
    typeof value === "string" && VISIT_STATUSES.includes(value as VisitStatus)
  );
}

export function isVisitType(value: unknown): value is VisitType {
  return typeof value === "string" && VISIT_TYPES.includes(value as VisitType);
}
