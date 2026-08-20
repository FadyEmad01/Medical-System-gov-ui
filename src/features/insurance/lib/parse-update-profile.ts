import type { AuthActionError } from "@/features/auth/lib/action-error";
import type { MaritalStatus, UpdateProfileRequestDto } from "../types";

export const MARITAL_STATUS_VALUES: readonly MaritalStatus[] = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
];

export function normalizeNullableString(
  value: string | null | undefined,
): string | null | undefined {
  if (value === null || value === undefined) return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Validates the profile boundary: maritalStatus must be a known enum value,
 * strings are trimmed, and empty optional strings become `null` (backend
 * semantics: `null`/omitted clears the field).
 */
export function parseUpdateProfileInput(
  input: UpdateProfileRequestDto,
):
  | { ok: true; data: UpdateProfileRequestDto }
  | { ok: false; error: AuthActionError } {
  if (!MARITAL_STATUS_VALUES.includes(input.maritalStatus)) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "errors.generic",
        fieldErrors: {},
      },
    };
  }

  return {
    ok: true,
    data: {
      maritalStatus: input.maritalStatus,
      occupation: normalizeNullableString(input.occupation),
      nationality: normalizeNullableString(input.nationality),
      preferredLanguage: normalizeNullableString(input.preferredLanguage),
      emergencyContactName: normalizeNullableString(input.emergencyContactName),
      emergencyContactPhone: normalizeNullableString(
        input.emergencyContactPhone,
      ),
    },
  };
}
