import "server-only";

import { apiClient } from "@/lib/api-client";
import type {
  AddDependentRequestDto,
  DependentResponseDto,
} from "../enrollment/types";

/** GET /insurance/dependents/{patientId} — the patient's dependents. */
export function getDependents(
  patientId: number,
  token: string,
): Promise<DependentResponseDto[]> {
  return apiClient.get<DependentResponseDto[]>(
    `/insurance/dependents/${patientId}`,
    { token },
  );
}

/** POST /insurance/dependents — adds a dependent to the patient. */
export function addDependent(
  token: string,
  input: AddDependentRequestDto,
): Promise<DependentResponseDto> {
  return apiClient.post<DependentResponseDto>("/insurance/dependents", input, {
    token,
  });
}

/** PATCH /insurance/dependents/{relationshipId}/end — body-less. */
export function endDependent(
  token: string,
  relationshipId: string,
): Promise<DependentResponseDto> {
  return apiClient.patch<DependentResponseDto>(
    `/insurance/dependents/${relationshipId}/end`,
    undefined,
    { token },
  );
}
