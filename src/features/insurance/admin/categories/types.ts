/**
 * Backend DTOs for ADMIN category configuration (admin-swagger.json).
 * InsuranceCategoryResponseDto and CategoryDocumentRequirementDto are already
 * typed on the citizen side and reused directly.
 */

import type { DocumentType } from "../../enrollment/types";
import type { MaritalStatus } from "../../types";

/** POST /categories + PUT /categories/{id} — identity fields. */
export interface InsuranceCategoryRequestDto {
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

/** PUT /categories/{id}/eligibility-rule — full replace/upsert. */
export interface SetCategoryEligibilityRuleRequestDto {
  minimumAge: number | null;
  maximumAge: number | null;
  allowedMaritalStatuses: MaritalStatus[];
  guardianRequired: boolean;
  dependentsAllowed: boolean;
}

/** POST .../requirements — one new requirement row. */
export interface AddCategoryDocumentRequirementRequestDto {
  documentType: DocumentType;
  displayName: string | null;
  helpText: string | null;
  sampleDocumentUrl: string | null;
  displayOrder: number;
  isMandatory: boolean;
}

/** PUT .../requirements — full replace of the required document-type set. */
export interface SetCategoryDocumentRequirementsRequestDto {
  documentTypes: DocumentType[];
}

/** PUT .../requirements/{requirementId} — metadata update incl. isActive. */
export interface UpdateCategoryDocumentRequirementRequestDto {
  displayName: string | null;
  helpText: string | null;
  sampleDocumentUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  isMandatory: boolean;
}
