import "server-only";

import { apiClient } from "@/lib/api-client";
import type { CardResponseDto } from "../../../types";
import type { CardDetailResponseDto, ReplacementReason } from "../types";

/** GET /insurance/cards/{patientId} — full card history (Admin only). */
export function getCardHistory(
  token: string,
  patientId: number,
): Promise<CardResponseDto[]> {
  return apiClient.get<CardResponseDto[]>(`/insurance/cards/${patientId}`, {
    token,
  });
}

/** GET /insurance/cards/detail/{cardId} — card + status-change audit trail. */
export function getCardDetail(
  token: string,
  cardId: string,
): Promise<CardDetailResponseDto> {
  return apiClient.get<CardDetailResponseDto>(
    `/insurance/cards/detail/${cardId}`,
    { token },
  );
}

/** PATCH /cards/{cardId}/suspend — Active → Suspended, reason required. */
export function suspendCard(
  token: string,
  cardId: string,
  reason: string,
): Promise<CardResponseDto> {
  return apiClient.patch<CardResponseDto>(
    `/insurance/cards/${cardId}/suspend`,
    { reason },
    { token },
  );
}

/** PATCH /cards/{cardId}/reactivate — Suspended → Active, bodyless. */
export function reactivateCard(
  token: string,
  cardId: string,
): Promise<CardResponseDto> {
  return apiClient.patch<CardResponseDto>(
    `/insurance/cards/${cardId}/reactivate`,
    undefined,
    { token },
  );
}

/** PATCH /cards/{cardId}/revoke — terminal, reason required. */
export function revokeCard(
  token: string,
  cardId: string,
  reason: string,
): Promise<CardResponseDto> {
  return apiClient.patch<CardResponseDto>(
    `/insurance/cards/${cardId}/revoke`,
    { reason },
    { token },
  );
}

/** POST /cards/{cardId}/renew — Active only; returns the successor card. */
export function renewCard(
  token: string,
  cardId: string,
  reason: string,
): Promise<CardResponseDto> {
  return apiClient.post<CardResponseDto>(
    `/insurance/cards/${cardId}/renew`,
    reason === "" ? {} : { reason },
    { token },
  );
}

/** POST /cards/{cardId}/replace — Active/Suspended; expiry carries forward. */
export function replaceCard(
  token: string,
  cardId: string,
  body: { replacementReason: ReplacementReason; reasonNote: string },
): Promise<CardResponseDto> {
  return apiClient.post<CardResponseDto>(
    `/insurance/cards/${cardId}/replace`,
    {
      replacementReason: body.replacementReason,
      ...(body.reasonNote === "" ? {} : { reasonNote: body.reasonNote }),
    },
    { token },
  );
}

/** PATCH /cards/{cardId}/rotate-token — no status change, no new row. */
export function rotateCardToken(
  token: string,
  cardId: string,
): Promise<CardResponseDto> {
  return apiClient.patch<CardResponseDto>(
    `/insurance/cards/${cardId}/rotate-token`,
    undefined,
    { token },
  );
}
