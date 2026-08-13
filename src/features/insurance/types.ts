/**
 * Backend DTOs for the Insurance feature.
 *
 * Shapes mirror the contracts verified against the live Swagger spec
 * (stg-api.runasp.net/swagger/v1/swagger.json): snake_case JSON property names,
 * additionalProperties:false (no extra fields are sent or accepted).
 */

export type Gender = "Male" | "Female";

export type MaritalStatus = "Single" | "Married" | "Divorced" | "Widowed";

/** GET /profile — citizen profile for the authenticated patient. */
export interface ProfileResponseDto {
  patientId: number;
  nationalId?: string;
  username?: string;
  fullName?: string;
  /** ISO date string. */
  dateOfBirth?: string;
  gender: Gender;
  mobileNumber?: string;
  governorate?: string;
  district?: string;
  email?: string;
  address?: string;
  occupation?: string | null;
  /** Null until the patient completes the profile gate (register never asks). */
  maritalStatus: MaritalStatus | null;
  nationality?: string | null;
  preferredLanguage?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * PUT /profile — the six editable profile fields. Identity fields are
 * read-only on the backend and rejected when sent; `null`/omitted clears.
 */
export interface UpdateProfileRequestDto {
  occupation?: string | null;
  maritalStatus: MaritalStatus;
  nationality?: string | null;
  preferredLanguage?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "UnderReview"
  | "WaitingForDocuments"
  | "Approved"
  | "Rejected"
  | "Cancelled";

export type EligibilityStatus =
  | "Eligible"
  | "NotEligible"
  | "PendingReview"
  | "Suspended"
  | "Expired";

export type VerificationStatus = "Verified" | "NotVerified" | "Pending";

export type CardStatus = "Active" | "Suspended" | "Revoked" | "Superseded";

export type CardIssueReason =
  | "Initial"
  | "Renewal"
  | "Replacement"
  | "Dependent"
  | "Migration";

/** One stage of the insurance application timeline. */
export interface TimelineStageDto {
  stageName?: string;
  isComplete: boolean;
  timestamp?: string;
}

/** GET /insurance/status/{patientId} — application + eligibility snapshot. */
export interface InsuranceStatusResponseDto {
  patientId: number;
  currentApplicationNumber?: string;
  currentApplicationId?: string;
  currentApplicationStatus?: ApplicationStatus;
  timeline?: TimelineStageDto[];
  eligibilityStatus?: EligibilityStatus;
  verificationStatus?: VerificationStatus;
  documentCount: number;
}

/** Card history entry (GET /insurance/cards/{patientId}) — newest first. */
export interface CardResponseDto {
  cardNumber?: string;
  /** UUID. */
  id: string;
  patientId: number;
  dependentPersonId?: string;
  holderFullName?: string;
  status: CardStatus;
  isCurrentlyValid: boolean;
  issueReason: CardIssueReason;
  version: number;
  cardTemplate?: string;
  tokenVersion: number;
  replacementReason?: string;
  reasonNote?: string;
  predecessorCardId?: string;
  successorCardId?: string;
  isLatestCard: boolean;
  issuedAt: string;
  expiresAt: string;
  applicationId: string;
  createdAt: string;
  correlationId?: string;
}

/** The five fields a patient must complete before applying for a card. */
export const PROFILE_GATE_FIELDS = [
  "occupation",
  "maritalStatus",
  "nationality",
  "emergencyContactName",
  "emergencyContactPhone",
] as const;

export type ProfileGateField = (typeof PROFILE_GATE_FIELDS)[number];
