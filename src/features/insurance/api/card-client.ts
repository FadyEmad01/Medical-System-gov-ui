import "server-only";

import { apiClient } from "@/lib/api-client";
import type { CardResponseDto } from "../types";

/**
 * GET /insurance/cards/current/{patientId} — the patient's current card.
 *
 * A 404 ("no active card") is a normal state — the caller maps it to `null`.
 */
export function getCurrentCard(
  patientId: number,
  token: string,
): Promise<CardResponseDto> {
  return apiClient.get<CardResponseDto>(
    `/insurance/cards/current/${patientId}`,
    { token },
  );
}
