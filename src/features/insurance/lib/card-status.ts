import type { CardResponseDto, InsuranceStatusResponseDto } from "../types";

export type CardStateKind =
  | "not-started"
  | "in-progress"
  | "awaiting-issuance"
  | "ready"
  | "attention";

export interface CardState {
  kind: CardStateKind;
  step: 0 | 1 | 2 | 3;
  card: CardResponseDto | null;
}

/**
 * Derives the insurance card stepper state from the application status and the
 * patient's current card. The API returns a single current card (404 = none
 * issued yet — even an approved application does not guarantee a card).
 *
 * Priority: an active, currently-valid card → a non-usable current card
 * (suspended/revoked/superseded/expired) → an approved application → documents
 * under review → not started.
 *
 * An empty `cardNumber` still counts as a card — only `status` and
 * `isCurrentlyValid` decide whether the card is usable.
 */
export function deriveCardState(
  status: InsuranceStatusResponseDto | null,
  currentCard: CardResponseDto | null,
): CardState {
  if (currentCard) {
    if (currentCard.status === "Active" && currentCard.isCurrentlyValid) {
      return { kind: "ready", step: 3, card: currentCard };
    }
    return { kind: "attention", step: 2, card: currentCard };
  }

  if (status?.currentApplicationStatus === "Approved") {
    return { kind: "awaiting-issuance", step: 2, card: null };
  }

  if (status && status.documentCount > 0) {
    return { kind: "in-progress", step: 2, card: null };
  }

  return { kind: "not-started", step: 1, card: null };
}
