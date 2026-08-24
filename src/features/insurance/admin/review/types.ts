/**
 * Backend DTOs for the ADMIN application-review feature.
 *
 * Shapes mirror the contracts read from admin-swagger.json (citizen module
 * admin surface): camelCase JSON property names.
 */

import type {
  ApplicationResponseDto,
  ApplicationReviewResponseDto,
  DocumentReviewStatus,
  DocumentType,
  InsuranceCategoryResponseDto,
  RelationshipType,
} from "../../enrollment/types";
import type {
  ApplicationStatus,
  EligibilityStatus,
  Gender,
  MaritalStatus,
} from "../../types";
import type {
  InsuranceEligibilityResponseDto,
  InsuranceVerificationResponseDto,
} from "../../verification/types";

export type {
  InsuranceEligibilityResponseDto,
  InsuranceVerificationResponseDto,
  VerificationContext,
  VerificationSource,
} from "../../verification/types";

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

/** Submission-time snapshot per live Admin swagger. */
export interface ApplicationDocumentDetailDto {
  citizenDocumentId: string;
  dependentPersonId: string | null;
  dependentFullName: string | null;
  documentType: DocumentType;
  documentNumber: string | null;
  fileName: string | null;
  fileUrl: string | null;
  fileType: string | null;
  fileSize: number;
  uploadedAt: string;
  expiresAt: string | null;
  reviewStatus: DocumentReviewStatus;
  addedToApplicationAt: string;
}

/** Submission-time snapshot per live Admin swagger. */
export interface ApplicationDependentDetailDto {
  dependentPersonId: string;
  fullName: string | null;
  dateOfBirth: string;
  gender: Gender;
  nationalId: string | null;
  relationshipType: RelationshipType;
  addedToApplicationAt: string;
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
  /** Live Admin swagger: arrays declare nullable:true and the schema has NO
   * required array — every property below can legally be absent. */
  applicant: ApplicantSummaryDto | null;
  insuranceCategory: InsuranceCategoryResponseDto | null;
  documents: ApplicationDocumentDetailDto[] | null;
  dependents: ApplicationDependentDetailDto[] | null;
  eligibility: InsuranceEligibilityResponseDto | null;
  verification: InsuranceVerificationResponseDto | null;
  reviewHistory: ApplicationReviewResponseDto[] | null;
}

/** Boundary input for the three reason-carrying decision actions. */
export interface DecisionInput {
  /** 1–1000 chars, required for reject/request-documents, optional for approve. */
  citizenVisibleReason: string;
  /** Optional, ≤2000 chars. Admin-only. */
  internalNotes: string;
}
