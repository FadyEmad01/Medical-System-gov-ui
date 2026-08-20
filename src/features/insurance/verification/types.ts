/**
 * Shared DTOs for insurance card verify + verification/eligibility writes.
 * Used by Admin verification UI and Doctor point-of-care.
 */

import type { CardStatus } from "../types";

/** POST /cards/verify response — deliberately minimal, no PII beyond the name. */
export interface CardVerificationResultDto {
  cardNumber: string | null;
  holderFullName: string | null;
  isCurrentlyValid: boolean;
  expiresAt: string | null;
  status: CardStatus;
}

export interface VerifyInsuranceInput {
  patientId: number;
  status: "Verified" | "NotVerified" | "Pending";
  context:
    | "Appointment"
    | "CheckIn"
    | "ClinicVisit"
    | "EmergencyAdmission"
    | "Billing";
  reason: string;
  remarks: string;
}

export interface CheckEligibilityInput {
  patientId: number;
  status:
    | "Eligible"
    | "NotEligible"
    | "PendingReview"
    | "Suspended"
    | "Expired";
  reason: string;
  remarks: string;
}
