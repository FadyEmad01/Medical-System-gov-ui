import "server-only";

import { apiClient } from "@/lib/api-client";
import type { CardResponseDto } from "../types";

/** GET /insurance/cards/{patientId} — card history, newest first. */
export function getCardHistory(
  patientId: number,
  token: string,
): Promise<CardResponseDto[]> {
  return apiClient.get<CardResponseDto[]>(`/insurance/cards/${patientId}`, {
    token,
  });
}
