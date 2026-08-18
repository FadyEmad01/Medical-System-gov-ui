import type { AuthActionError } from "@/features/auth/lib/action-error";
import type { DecisionInput } from "../types";

export const CITIZEN_REASON_MAX = 1000;
export const INTERNAL_NOTES_MAX = 2000;

/**
 * Boundary validation for the three reason-carrying decisions, shared by the
 * server actions. `requireReason` differs per action: reject and
 * request-documents must explain themselves to the citizen (1–1000 chars);
 * approve may stay silent.
 *
 * Input arrives pre-trimmed from the action; empty string means "omitted".
 */
export function validateDecision(
  input: DecisionInput,
  options: { requireReason: boolean },
): { ok: true; data: DecisionInput } | { ok: false; error: AuthActionError } {
  if (
    input.citizenVisibleReason.length > CITIZEN_REASON_MAX ||
    (options.requireReason && input.citizenVisibleReason === "")
  ) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "admin.actions.errors.reasonRequired",
        fieldErrors: { citizenVisibleReason: "admin.actions.errors.reason" },
      },
    };
  }

  if (input.internalNotes.length > INTERNAL_NOTES_MAX) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "admin.actions.errors.notesTooLong",
        fieldErrors: { internalNotes: "admin.actions.errors.notes" },
      },
    };
  }

  return {
    ok: true,
    data: {
      citizenVisibleReason: input.citizenVisibleReason,
      internalNotes: input.internalNotes,
    },
  };
}
