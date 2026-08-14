import "server-only";

import { apiClient } from "@/lib/api-client";
import type {
  ApplicationResponseDto,
  EnrollmentReadinessResponseDto,
  EnrollmentResponseDto,
  EnrollmentSummaryResponseDto,
  InsuranceCategoryResponseDto,
} from "../enrollment/types";

/** GET /insurance/categories — active insurance categories, display-ordered. */
export function getCategories(
  token: string,
): Promise<InsuranceCategoryResponseDto[]> {
  return apiClient.get<InsuranceCategoryResponseDto[]>(
    "/insurance/categories",
    { token },
  );
}

/** GET /insurance/enrollment/current — 404 when the patient has no enrollment. */
export function getCurrentEnrollment(
  token: string,
): Promise<EnrollmentResponseDto> {
  return apiClient.get<EnrollmentResponseDto>("/insurance/enrollment/current", {
    token,
  });
}

/** POST /insurance/enrollment/start — begins enrollment for a category. */
export function startEnrollment(
  token: string,
  insuranceCategoryId: InsuranceCategoryResponseDto["id"],
): Promise<EnrollmentResponseDto> {
  return apiClient.post<EnrollmentResponseDto>(
    "/insurance/enrollment/start",
    { insuranceCategoryId },
    { token },
  );
}

/** GET /insurance/enrollment/readiness — gates the wizard's Submit step. */
export function getReadiness(
  token: string,
): Promise<EnrollmentReadinessResponseDto> {
  return apiClient.get<EnrollmentReadinessResponseDto>(
    "/insurance/enrollment/readiness",
    { token },
  );
}

/** GET /insurance/enrollment/summary — everything the review step renders. */
export function getSummary(
  token: string,
): Promise<EnrollmentSummaryResponseDto> {
  return apiClient.get<EnrollmentSummaryResponseDto>(
    "/insurance/enrollment/summary",
    { token },
  );
}

/** PATCH /insurance/enrollment/submit — body-less; moves Draft → Submitted. */
export function submitEnrollment(
  token: string,
): Promise<ApplicationResponseDto> {
  return apiClient.patch<ApplicationResponseDto>(
    "/insurance/enrollment/submit",
    undefined,
    { token },
  );
}
