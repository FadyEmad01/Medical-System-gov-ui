import type { AuthActionError } from "@/features/auth/lib/action-error";

/** Pure helpers for verification server actions (no `"use server"`). */

export const REASON_MAX = 1000;
export const REMARKS_MAX = 2000;

export function invalid(formError: string): {
  ok: false;
  error: AuthActionError;
} {
  return {
    ok: false,
    error: { kind: "validation", formError, fieldErrors: {} },
  };
}

export function validPatient(patientId: number): boolean {
  return Number.isInteger(patientId) && patientId >= 1;
}

/** The verify endpoint requires a UUID-shaped verification token. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Trimmed token must be non-empty, ≤500 chars, and UUID-formatted. */
export function isValidVerificationToken(token: string): boolean {
  if (token === "" || token.length > 500) return false;
  return UUID_PATTERN.test(token);
}
