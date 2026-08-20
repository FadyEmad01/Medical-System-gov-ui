import { isAuthActionError } from "../hooks/session-guard";

/**
 * Maps AuthActionError.kind → insurance i18n key under `errors.*`.
 * Shared by card, tracking, enrollment wizard, and dashboard aggregates.
 */
export function errorMessageKey(error: unknown): string {
  if (!isAuthActionError(error)) return "errors.generic";
  if (error.kind === "unauthorized") return "errors.sessionExpired";
  if (error.kind === "forbidden") return "errors.forbidden";
  if (error.kind === "notFound") return "errors.notFound";
  return "errors.generic";
}
