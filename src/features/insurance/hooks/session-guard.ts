"use client";

import type { QueryClient } from "@tanstack/react-query";
import { ME_QUERY_KEY } from "@/features/auth/hooks/use-me";
import type { AuthActionError } from "@/features/auth/lib/action-error";

/**
 * Type guard for the structured error thrown by insurance server actions.
 * React-query types `error` as `Error`, so consumers narrow before branching
 * on `error.kind`.
 */
export function isAuthActionError(error: unknown): error is AuthActionError {
  return (
    typeof error === "object" &&
    error !== null &&
    "kind" in error &&
    typeof (error as { kind?: unknown }).kind === "string"
  );
}

/** True when the error means the current session is dead (401 only). */
export function isSessionExpiry(error: AuthActionError): boolean {
  return error.kind === "unauthorized";
}

/** True when the user is authenticated but lacks permission (403). */
export function isForbidden(error: AuthActionError): boolean {
  return error.kind === "forbidden";
}

/**
 * True for deterministic auth errors that no retry can heal: a dead session
 * (401) or a missing permission (403). Retrying either just repeats the same
 * failed request.
 */
export function isTerminalActionError(error: AuthActionError): boolean {
  return isSessionExpiry(error) || isForbidden(error);
}

/**
 * Ghost-session guard for insurance data hooks.
 *
 * The server actions already clear the session cookie on 401; this drops the
 * cached identity and insurance data too, so `AuthGuard` redirects on the
 * next `useMe` render instead of rendering protected UI against a dead
 * session — and no cached PII survives a session switch.
 *
 * 403 (forbidden) is deliberately NOT handled here: the user is signed in,
 * so caches stay intact and callers show the localized forbidden toast
 * instead.
 *
 * Returns `true` when the error was handled as session expiry so callers can
 * return early.
 */
export function handleSessionExpiry(
  queryClient: QueryClient,
  error: AuthActionError,
): boolean {
  if (!isSessionExpiry(error)) return false;
  queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
  queryClient.removeQueries({ queryKey: ["insurance"] });
  // Admin bundles carry full applicant PII (nationalId, address, mobile) —
  // they must never survive a session switch on a shared machine.
  queryClient.removeQueries({ queryKey: ["admin"] });
  return true;
}
