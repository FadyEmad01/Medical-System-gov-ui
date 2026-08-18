/**
 * Backend DTOs for the ADMIN application-review feature.
 *
 * Shapes mirror the contracts read from admin-swagger.json (citizen module
 * admin surface): camelCase JSON property names.
 */

import type {
  ApplicationResponseDto,
  ApplicationReviewResponseDto,
  CitizenDocumentResponseDto,
  DependentResponseDto,
  InsuranceCategoryResponseDto,
} from "../../enrollment/types";
import type {
  ApplicationStatus,
  EligibilityStatus,
  Gender,
  MaritalStatus,
} from "../../types";

/** Server-paged result envelope (queue endpoint). */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ApplicationQueueResult = PagedResult<ApplicationResponseDto>;

/** The applicant's full citizen profile, revealed only on the review screen. */
export interface ApplicantSummaryDto {
  patientId: number;
  fullName: string;
  nationalId: string;
  dateOfBirth: string;
  gender: Gender;
  mobileNumber: string | null;
  governorate: string | null;
  district: string | null;
  email: string | null;
  address: string | null;
  occupation: string | null;
  maritalStatus: MaritalStatus | null;
  nationality: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
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

export type VerificationContext =
  | "Appointment"
  | "CheckIn"
  | "ClinicVisit"
  | "EmergencyAdmission"
  | "Billing";

export type VerificationSource = "Doctor" | "Admin" | "System";

/** Latest recorded insurance verification (POST /verification/verify writer). */
export interface InsuranceVerificationResponseDto {
  id: string;
  patientId: number;
  patientFullName: string | null;
  patientNationalId: string | null;
  status: "Verified" | "NotVerified" | "Pending";
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

/**
 * GET /applications/{applicationId}/review — everything an Admin needs to
 * decide, in one call. NOTE: opening this endpoint auto-claims a freshly
 * Submitted application (advances it to UnderReview); treat the GET as a
 * state transition, never prefetch it.
 */
export interface ApplicationReviewDetailResponseDto {
  applicationNumber: string;
  id: string;
  patientId: number;
  status: ApplicationStatus;
  submissionChannel: ApplicationResponseDto["submissionChannel"];
  submittedAt: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  decisionReason: string | null;
  eligibilityStatusSnapshot: EligibilityStatus | null;
  verificationStatusSnapshot: InsuranceVerificationResponseDto["status"] | null;
  createdAt: string;
  correlationId: string;
  applicant: ApplicantSummaryDto;
  insuranceCategory: InsuranceCategoryResponseDto;
  documents: CitizenDocumentResponseDto[];
  dependents: DependentResponseDto[];
  eligibility: InsuranceEligibilityResponseDto | null;
  verification: InsuranceVerificationResponseDto | null;
  reviewHistory: ApplicationReviewResponseDto[];
}

/** Boundary input for the three reason-carrying decision actions. */
export interface DecisionInput {
  /** 1–1000 chars, required for reject/request-documents, optional for approve. */
  citizenVisibleReason: string;
  /** Optional, ≤2000 chars. Admin-only. */
  internalNotes: string;
}
