import "server-only";

import { apiClient } from "@/lib/api-client";
import type {
  CategoryDocumentRequirementDto,
  InsuranceCategoryResponseDto,
} from "../../../enrollment/types";
import type {
  AddCategoryDocumentRequirementRequestDto,
  InsuranceCategoryRequestDto,
  SetCategoryEligibilityRuleRequestDto,
  UpdateCategoryDocumentRequirementRequestDto,
} from "../types";

/** GET /insurance/categories/all — every category, incl. inactive (Admin). */
export function getAllCategories(
  token: string,
): Promise<InsuranceCategoryResponseDto[]> {
  return apiClient.get<InsuranceCategoryResponseDto[]>(
    "/insurance/categories/all",
    { token },
  );
}

/** POST /insurance/categories — create. */
export function createCategory(
  token: string,
  body: InsuranceCategoryRequestDto,
): Promise<InsuranceCategoryResponseDto> {
  return apiClient.post<InsuranceCategoryResponseDto>(
    "/insurance/categories",
    body,
    { token },
  );
}

/** PUT /insurance/categories/{id} — identity fields, full replace. */
export function updateCategory(
  token: string,
  categoryId: string,
  body: InsuranceCategoryRequestDto,
): Promise<InsuranceCategoryResponseDto> {
  return apiClient.put<InsuranceCategoryResponseDto>(
    `/insurance/categories/${categoryId}`,
    body,
    { token },
  );
}

/** PUT /insurance/categories/{id}/eligibility-rule — full replace/upsert. */
export function setEligibilityRule(
  token: string,
  categoryId: string,
  body: SetCategoryEligibilityRuleRequestDto,
): Promise<InsuranceCategoryResponseDto> {
  return apiClient.put<InsuranceCategoryResponseDto>(
    `/insurance/categories/${categoryId}/eligibility-rule`,
    body,
    { token },
  );
}

/** GET /insurance/categories/{id}/requirements — all rows incl. inactive. */
export function getRequirements(
  token: string,
  categoryId: string,
): Promise<CategoryDocumentRequirementDto[]> {
  return apiClient.get<CategoryDocumentRequirementDto[]>(
    `/insurance/categories/${categoryId}/requirements`,
    { token },
  );
}

export function addRequirement(
  token: string,
  categoryId: string,
  body: AddCategoryDocumentRequirementRequestDto,
): Promise<CategoryDocumentRequirementDto> {
  return apiClient.post<CategoryDocumentRequirementDto>(
    `/insurance/categories/${categoryId}/requirements`,
    body,
    { token },
  );
}

export function updateRequirement(
  token: string,
  categoryId: string,
  requirementId: string,
  body: UpdateCategoryDocumentRequirementRequestDto,
): Promise<CategoryDocumentRequirementDto> {
  return apiClient.put<CategoryDocumentRequirementDto>(
    `/insurance/categories/${categoryId}/requirements/${requirementId}`,
    body,
    { token },
  );
}

export function deleteRequirement(
  token: string,
  categoryId: string,
  requirementId: string,
): Promise<void> {
  return apiClient.delete<void>(
    `/insurance/categories/${categoryId}/requirements/${requirementId}`,
    { token },
  );
}
