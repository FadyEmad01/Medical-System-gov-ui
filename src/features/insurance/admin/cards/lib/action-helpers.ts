import type {
  ActionResult,
  AuthActionError,
} from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../../lib/session-aware-error";
import type { CardResponseDto } from "../../../types";
import type { ReplacementReason } from "../types";
import { validateCardReason } from "./card-reason-validation";

export const REPLACEMENT_REASONS: readonly ReplacementReason[] = [
  "Lost",
  "Damaged",
  "Stolen",
  "Other",
];

export function trimmed(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function invalid(
  formError: string,
): { ok: false; error: AuthActionError } {
  return {
    ok: false,
    error: { kind: "validation", formError, fieldErrors: {} },
  };
}

export function validPatient(patientId: number): boolean {
  return Number.isInteger(patientId) && patientId >= 1;
}

export async function reasonAction(
  cardId: string,
  reason: string,
  required: boolean,
  call: (
    token: string,
    cardId: string,
    reason: string,
  ) => Promise<CardResponseDto>,
): Promise<ActionResult<CardResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const parsed = validateCardReason(trimmed(reason), { required });
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const card = await call(token, trimmed(cardId), parsed.data);
    return { ok: true, data: card };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

export async function bodylessAction(
  cardId: string,
  call: (token: string, cardId: string) => Promise<CardResponseDto>,
): Promise<ActionResult<CardResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const card = await call(token, trimmed(cardId));
    return { ok: true, data: card };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}
