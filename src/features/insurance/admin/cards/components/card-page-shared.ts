import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import type { CardAction } from "../lib/allowed-card-actions";
import type { ReplacementReason } from "../types";

export const REPLACEMENT_REASONS: ReplacementReason[] = [
  "Lost",
  "Damaged",
  "Stolen",
  "Other",
];

export function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
}

/** Dialog mode: which lifecycle action is collecting input. */
export type DialogState =
  | {
      kind: "reason";
      action: Extract<CardAction, "suspend" | "revoke" | "renew">;
    }
  | { kind: "replace" }
  | { kind: "confirm"; action: "reactivate" | "rotate-token" };
