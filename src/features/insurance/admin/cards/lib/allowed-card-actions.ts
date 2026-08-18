import type { CardStatus } from "../../../types";

/** Card lifecycle actions, as derived from a card's current status. */
export type CardAction =
  | "suspend"
  | "reactivate"
  | "revoke"
  | "renew"
  | "replace"
  | "rotate-token";

/**
 * Status → lifecycle actions the backend accepts. Revoked and Superseded are
 * terminal (Superseded means a renew/replace already created a successor —
 * act on the successor instead).
 */
export function deriveAllowedCardActions(status: CardStatus): CardAction[] {
  switch (status) {
    case "Active":
      return ["suspend", "revoke", "renew", "replace", "rotate-token"];
    case "Suspended":
      return ["reactivate", "revoke", "replace"];
    default:
      return [];
  }
}

/** Actions that ask for a free-text reason (required or optional). */
export const REASON_ACTIONS: ReadonlySet<CardAction> = new Set([
  "suspend",
  "revoke",
  "renew",
]);

/** The only action that needs a replacement-reason select instead. */
export const REPLACEMENT_ACTION: CardAction = "replace";
