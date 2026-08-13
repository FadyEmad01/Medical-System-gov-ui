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
 * Derives the insurance card stepper state from the application status and
 * card history. The API returns cards newest-first, so `cards[0]` is the
 * latest card. Priority: a valid active card → an unhealthy card → an approved
 * application → documents under review → not started.
 *
 * An empty `cardNumber` still counts as a card — only `status` and
 * `isCurrentlyValid` decide whether the card is usable.
 */
export function deriveCardState(
  status: InsuranceStatusResponseDto | null,
  cards: CardResponseDto[],
): CardState {
  const latest = cards[0] ?? null;

  if (latest && latest.status === "Active" && latest.isCurrentlyValid) {
    return { kind: "ready", step: 3, card: latest };
  }

  if (
    latest &&
    (latest.status === "Suspended" ||
      latest.status === "Revoked" ||
      latest.status === "Superseded")
  ) {
    return { kind: "attention", step: 2, card: latest };
  }

  if (status?.currentApplicationStatus === "Approved") {
    return { kind: "awaiting-issuance", step: 2, card: null };
  }

  if (status && status.documentCount > 0) {
    return { kind: "in-progress", step: 2, card: null };
  }

  return { kind: "not-started", step: 1, card: null };
}
