import "server-only";

import { apiClient } from "@/lib/api-client";
import type { InsuranceStatusResponseDto } from "../types";

/** GET /insurance/status/{patientId} — application + eligibility snapshot. */
export function getInsuranceStatus(
  patientId: number,
  token: string,
): Promise<InsuranceStatusResponseDto> {
  return apiClient.get<InsuranceStatusResponseDto>(
    `/insurance/status/${patientId}`,
    { token },
  );
}
