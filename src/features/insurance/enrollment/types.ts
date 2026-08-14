/**
 * Backend DTOs for the insurance ENROLLMENT subfeature.
 *
 * Shapes mirror the contracts verified against the live Swagger spec
 * (stg-api.runasp.net/swagger/v1/swagger.json): camelCase JSON property names,
 * additionalProperties:false (no extra fields are sent or accepted).
 */

import type {
  ApplicationStatus,
  Gender,
  MaritalStatus,
  ProfileResponseDto,
} from "../types";

export type DocumentType =
  | "NationalId"
  | "BirthCertificate"
  | "MarriageCertificate"
  | "EmploymentLetter"
  | "DisabilityCertificate"
  | "DeathCertificate"
  | "GuardianAuthorization"
  | "FamilyRegistration";

export type DocumentReviewStatus = "Pending" | "Approved" | "Rejected";

export type RelationshipType = "Spouse" | "Child" | "Parent" | "Guardian";

export type DependentStatus = "Active" | "Inactive" | "Deceased";

export type ReviewOutcome = "Approved" | "Rejected" | "NeedMoreDocuments";

export type SubmissionChannel =
  | "WebPortal"
  | "MobileApp"
  | "AdminPortal"
  | "Kiosk"
  | "GovernmentImport";

/** One required document slot of an insurance category. */
export interface CategoryDocumentRequirementDto {
  id: string;
  documentType: DocumentType;
  displayName: string;
  helpText: string | null;
  sampleDocumentUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  isMandatory: boolean;
}

/** GET /categories — a category a patient can apply for. */
export interface InsuranceCategoryResponseDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  requiredDocumentTypes: DocumentType[];
  documentRequirements: CategoryDocumentRequirementDto[];
  minimumAge: number | null;
  maximumAge: number | null;
  /** Empty array = no restriction. */
  allowedMaritalStatuses: MaritalStatus[];
  guardianRequired: boolean;
  dependentsAllowed: boolean;
  createdAt: string;
  updatedAt: string;
}

/** POST /enrollment/start + GET /enrollment/current. */
export interface EnrollmentResponseDto {
  id: string;
  patientId: number;
  insuranceCategory: InsuranceCategoryResponseDto;
  applicationId: string;
  applicationNumber: string;
  applicationStatus: ApplicationStatus;
  createdAt: string;
  correlationId: string;
}

/** GET /enrollment/readiness — gates the Submit button. */
export interface EnrollmentReadinessResponseDto {
  isReady: boolean;
  missingRequirements: string[];
  missingDocumentTypes: DocumentType[];
  isEligibleForCategory: boolean;
  eligibilityViolations: string[];
  profileComplete: boolean;
  dependentsValid: boolean;
  documentsComplete: boolean;
  applicationExists: boolean;
}

/** GET /documents/{patientId} — newest first. */
export interface CitizenDocumentResponseDto {
  id: string;
  patientId: number;
  dependentPersonId: string | null;
  documentType: DocumentType;
  documentNumber: string | null;
  fileName: string | null;
  fileUrl: string | null;
  fileType: string | null;
  fileSize: number;
  uploadedAt: string;
  expiresAt: string | null;
  reviewStatus: DocumentReviewStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  isCurrent: boolean;
  correlationId: string;
}

/** GET /dependents/{patientId}. */
export interface DependentResponseDto {
  dependentPersonId: string;
  fullName: string | null;
  dateOfBirth: string;
  gender: Gender;
  nationalId: string | null;
  status: DependentStatus;
  relationshipId: string;
  relationshipType: RelationshipType;
  isPrimarySponsor: boolean;
  startedAt: string;
  endedAt: string | null;
  isActive: boolean;
  correlationId: string;
}

/** POST /dependents — the four name parts are all required. */
export interface AddDependentRequestDto {
  firstName: string;
  secondName: string;
  thirdName: string;
  fourthName: string;
  dateOfBirth: string;
  gender: Gender;
  relationshipType: RelationshipType;
  nationalId?: string;
}

/** GET /enrollment/summary — everything the review step renders. */
export interface EnrollmentSummaryResponseDto {
  enrollmentId: string;
  insuranceCategory: InsuranceCategoryResponseDto;
  profile: ProfileResponseDto;
  dependents: DependentResponseDto[];
  documents: CitizenDocumentResponseDto[];
  missingDocumentTypes: DocumentType[];
  applicationId: string;
  applicationNumber: string;
  applicationStatus: ApplicationStatus;
  readiness: EnrollmentReadinessResponseDto;
  warnings: string[];
}

/** Application record (GET /applications/detail/{id} / by-number/{num}). */
export interface ApplicationResponseDto {
  applicationNumber: string;
  id: string;
  patientId: number;
  status: ApplicationStatus;
  submissionChannel: SubmissionChannel;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  /** Only present when the status is Approved or Rejected. */
  decisionReason: string | null;
  eligibilityStatusSnapshot: string | null;
  verificationStatusSnapshot: string | null;
  documentCount: number;
  dependentCount: number;
  createdAt: string;
  correlationId: string;
}

/** One review-history entry — newest first. */
export interface ApplicationReviewResponseDto {
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  reviewOutcome: ReviewOutcome | null;
  reviewedBy: string;
  reviewedAt: string;
  citizenVisibleReason: string | null;
  /** Always null for a patient caller. */
  internalNotes: string | null;
}

export interface ApplicationDetailResponseDto extends ApplicationResponseDto {
  reviewHistory: ApplicationReviewResponseDto[];
}

/**
 * Input payload for the document-upload server action.
 *
 * This is a boundary type: every field arrives as plain text or a File from
 * the client and is re-validated inside the action before reaching the API.
 */
export interface UploadDocumentInput {
  documentType: DocumentType;
  file: File;
  documentNumber?: string;
  expiresAt?: string;
  dependentPersonId?: string;
}
