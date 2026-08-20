import type { AuthActionError } from "@/features/auth/lib/action-error";

/** Pure helpers for verification server actions (no `"use server"`). */

export const REASON_MAX = 1000;
export const REMARKS_MAX = 2000;

export function invalid(formError: string): { ok: false; error: AuthActionError } {
  return {
    ok: false,
    error: { kind: "validation", formError, fieldErrors: {} },
  };
}

export function validPatient(patientId: number): boolean {
  return Number.isInteger(patientId) && patientId >= 1;
}
