/**
 * Shared DTOs for insurance card verify + verification/eligibility reads/writes.
 * Used by Admin verification UI, Doctor point-of-care, and Admin review snapshots.
 */

import type {
  CardStatus,
  EligibilityStatus,
  VerificationStatus,
} from "../types";

/** POST /cards/verify response — deliberately minimal, no PII beyond the name. */
export interface CardVerificationResultDto {
  cardNumber: string | null;
  holderFullName: string | null;
  isCurrentlyValid: boolean;
  expiresAt: string | null;
  status: CardStatus;
}

export type VerificationContext =
  | "Appointment"
  | "CheckIn"
  | "ClinicVisit"
  | "EmergencyAdmission"
  | "Billing";

export type VerificationSource = "Doctor" | "Admin" | "System";

export interface VerifyInsuranceInput {
  patientId: number;
  status: VerificationStatus;
  context: VerificationContext;
  reason: string;
  remarks: string;
}

export interface CheckEligibilityInput {
  patientId: number;
  status: EligibilityStatus;
  reason: string;
  remarks: string;
}

/** Latest recorded eligibility decision (POST /eligibility/check writer). */
export interface InsuranceEligibilityResponseDto {
  id: string;
  patientId: number;
  patientFullName: string | null;
  patientNationalId: string | null;
  status: EligibilityStatus;
  reason: string | null;
  checkedAt: string;
  checkedBy: number;
  remarks: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/** Latest recorded insurance verification (POST /verification/verify writer). */
export interface InsuranceVerificationResponseDto {
  id: string;
  patientId: number;
  patientFullName: string | null;
  patientNationalId: string | null;
  status: VerificationStatus;
  context: VerificationContext | null;
  source: VerificationSource | null;
  reason: string | null;
  remarks: string | null;
  verifiedAt: string;
  expiresAt: string | null;
  verifiedBy: number;
  correlationId: string;
  isCurrentlyValid: boolean;
}
