"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { handleSessionExpiry, isForbidden } from "./session-guard";

type MutationErrorHandlers = {
  onSessionExpired: () => void;
  onForbidden: () => void;
  onGeneric: () => void;
  onValidation?: (error: AuthActionError) => void;
  onNotFound?: () => void;
  onConflict?: () => void;
};

/**
 * Shared mutation onError ladder: session purge → validation → forbidden →
 * not-found / conflict → generic. Callers supply localized toasts.
 */
export function useActionMutationError(handlers: MutationErrorHandlers) {
  const queryClient = useQueryClient();

  return (error: AuthActionError) => {
    if (handleSessionExpiry(queryClient, error)) {
      handlers.onSessionExpired();
      return;
    }
    if (error.kind === "validation") {
      handlers.onValidation?.(error);
      return;
    }
    if (isForbidden(error)) {
      handlers.onForbidden();
      return;
    }
    if (error.kind === "notFound") {
      if (handlers.onNotFound) handlers.onNotFound();
      else handlers.onGeneric();
      return;
    }
    if (error.kind === "conflict") {
      if (handlers.onConflict) handlers.onConflict();
      else handlers.onGeneric();
      return;
    }
    handlers.onGeneric();
  };
}
