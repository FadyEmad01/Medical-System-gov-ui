/**
 * Backend DTOs for the ADMIN card-lifecycle feature (admin-swagger.json).
 * CardResponseDto itself is already typed on the citizen side and reused.
 */

import type { CardResponseDto } from "../../types";

/** One entry of a card's lifecycle audit trail. */
export interface CardStatusChangeResponseDto {
  id: string;
  previousStatus: CardResponseDto["status"];
  newStatus: CardResponseDto["status"];
  reason: string | null;
  changedBy: number;
  changedAt: string;
}

/** GET /cards/detail/{cardId} — a card + its full status-change history. */
export interface CardDetailResponseDto extends CardResponseDto {
  statusHistory: CardStatusChangeResponseDto[];
}

export type ReplacementReason = "Lost" | "Damaged" | "Stolen" | "Other";
