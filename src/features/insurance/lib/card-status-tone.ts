/**
 * Card status → badge tone from semantic status tokens. Single source for
 * citizen card, admin lifecycle, doctor scan, and dashboard status cards.
 */
import type { CardStatus } from "../types";

export const CARD_STATUS_TONE: Record<CardStatus, string> = {
  Active: "bg-success/10 text-success",
  Suspended: "bg-warning/10 text-warning",
  Revoked: "bg-revoked/10 text-revoked",
  Superseded: "bg-superseded/10 text-superseded",
};
