import "server-only";

import { apiClient } from "@/lib/api-client";
import type { ApplicationResponseDto } from "../../../enrollment/types";
import type { DecisionInput } from "../types";

/** PATCH /applications/{id}/approve — auto-issues cards on success. */
export function approveApplication(
  token: string,
  applicationId: string,
  input: DecisionInput,
): Promise<ApplicationResponseDto> {
  return apiClient.patch<ApplicationResponseDto>(
    `/insurance/applications/${applicationId}/approve`,
    serializeDecision(input),
    { token },
  );
}

/** PATCH /applications/{id}/reject — citizenVisibleReason required. */
export function rejectApplication(
  token: string,
  applicationId: string,
  input: DecisionInput,
): Promise<ApplicationResponseDto> {
  return apiClient.patch<ApplicationResponseDto>(
    `/insurance/applications/${applicationId}/reject`,
    serializeDecision(input),
    { token },
  );
}

/** PATCH /applications/{id}/request-documents — sends back to the citizen. */
export function requestDocuments(
  token: string,
  applicationId: string,
  input: DecisionInput,
): Promise<ApplicationResponseDto> {
  return apiClient.patch<ApplicationResponseDto>(
    `/insurance/applications/${applicationId}/request-documents`,
    serializeDecision(input),
    { token },
  );
}

/** PATCH /applications/{id}/back-to-review — bodyless, resumes review. */
export function backToReview(
  token: string,
  applicationId: string,
): Promise<ApplicationResponseDto> {
  return apiClient.patch<ApplicationResponseDto>(
    `/insurance/applications/${applicationId}/back-to-review`,
    undefined,
    { token },
  );
}

/** Empty optionals are omitted, never sent as empty strings. */
function serializeDecision(input: DecisionInput): Record<string, string> {
  const body: Record<string, string> = {};
  if (input.citizenVisibleReason !== "")
    body.citizenVisibleReason = input.citizenVisibleReason;
  if (input.internalNotes !== "") body.internalNotes = input.internalNotes;
  return body;
}
