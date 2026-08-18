import "server-only";

import { apiClient } from "@/lib/api-client";
import type { CardDetailResponseDto, CardResponseDto } from "../types";

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

/**
 * GET /insurance/cards/{patientId} — every card the patient (and their
 * dependents) has ever held, newest first. Admin or the patient themselves
 * (own patientId only; the backend 404s anyone else).
 */
export function getCardHistory(
  patientId: number,
  token: string,
): Promise<CardResponseDto[]> {
  return apiClient.get<CardResponseDto[]>(`/insurance/cards/${patientId}`, {
    token,
  });
}

/** GET /insurance/cards/detail/{cardId} — card + status-change audit trail. */
export function getCardDetail(
  cardId: string,
  token: string,
): Promise<CardDetailResponseDto> {
  return apiClient.get<CardDetailResponseDto>(
    `/insurance/cards/detail/${cardId}`,
    { token },
  );
}
