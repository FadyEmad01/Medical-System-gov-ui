import type { CardStatus } from "../types";

/**
 * Card status → badge tone built from the semantic status tokens. Shared by
 * the admin card lifecycle screen and the card verification result so both
 * surfaces speak the same color vocabulary.
 */
export const CARD_STATUS_TONE: Record<CardStatus, string> = {
  Active: "bg-success/10 text-success",
  Suspended: "bg-warning/10 text-warning",
  Revoked: "bg-revoked/10 text-revoked",
  Superseded: "bg-muted text-muted-foreground",
};
