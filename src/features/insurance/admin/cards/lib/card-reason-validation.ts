import type { AuthActionError } from "@/features/auth/lib/action-error";

export const CARD_REASON_MAX = 1000;

/**
 * Boundary validation for card lifecycle reasons: ≤1000 chars; suspend and
 * revoke require one (the service enforces it too — this fails fast at the
 * boundary), renew's is optional.
 */
export function validateCardReason(
  reason: string,
  options: { required: boolean },
): { ok: true; data: string } | { ok: false; error: AuthActionError } {
  if ((options.required && reason === "") || reason.length > CARD_REASON_MAX) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "admin.cards.errors.reasonInvalid",
        fieldErrors: {},
      },
    };
  }
  return { ok: true, data: reason };
}
