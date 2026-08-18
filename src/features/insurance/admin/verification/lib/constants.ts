import type { CheckEligibilityInput, VerifyInsuranceInput } from "../types";

/**
 * Closed enum sets for the verification surface — the single source both the
 * server actions (boundary guards) and the UI selects read, so they cannot
 * drift apart.
 */

export const VERIFICATION_STATUSES = [
  "Verified",
  "NotVerified",
  "Pending",
] as const;
export type VerificationStatus = VerifyInsuranceInput["status"];

export const ELIGIBILITY_STATUSES = [
  "Eligible",
  "NotEligible",
  "PendingReview",
  "Suspended",
  "Expired",
] as const;
export type EligibilityStatus = CheckEligibilityInput["status"];

export const VERIFICATION_CONTEXTS = [
  "Appointment",
  "CheckIn",
  "ClinicVisit",
  "EmergencyAdmission",
  "Billing",
] as const;
export type VerificationContext = VerifyInsuranceInput["context"];
