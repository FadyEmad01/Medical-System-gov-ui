import type { z } from "zod";
import { ApiError, type ApiErrorKind } from "@/lib/api-client";
import { parseProblemDetails } from "@/lib/problem-details";

/**
 * Structured error returned by every server action.
 *
 * Server Actions crossing the RSC boundary can only carry serializable data, so
 * we never leak an `Error` instance — callers branch on `ok` and read `error`
 * to map field messages back into React Hook Form via `setError`.
 */
export interface AuthActionError {
  kind: ApiErrorKind;
  formError: string;
  fieldErrors: Record<string, string>;
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AuthActionError };

export function toActionError(err: unknown): AuthActionError {
  if (err instanceof ApiError) {
    const parsed = err.problemDetails
      ? parseProblemDetails(err.problemDetails)
      : { fieldErrors: {}, formError: err.message };

    // The login endpoint deliberately returns the same message regardless of
    // which credential was wrong — translate that generic 401 into a clean,
    // localized message. Don't shadow field-level 400s though.
    const isLogin401 =
      err.kind === "unauthorized" &&
      Object.keys(parsed.fieldErrors).length === 0;
    if (isLogin401) {
      return {
        kind: err.kind,
        formError: "errors.invalidCredentials",
        fieldErrors: {},
      };
    }

    if (err.kind === "network" || err.kind === "timeout") {
      return {
        kind: err.kind,
        formError: "errors.serverUnreachable",
        fieldErrors: parsed.fieldErrors,
      };
    }

    return {
      kind: err.kind,
      formError: parsed.formError ?? err.message,
      fieldErrors: parsed.fieldErrors,
    };
  }
  return {
    kind: "network",
    formError: "errors.requestFailed",
    fieldErrors: {},
  };
}

/**
 * Maps Zod issues into the same `AuthActionError` shape the API errors use.
 * Keeps the server-side validation boundary consistent with `setError` — a
 * rogue client that bypasses the form schemas still gets clean field errors.
 */
export function toValidationError(error: z.ZodError): AuthActionError {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    fieldErrors[key] ??= issue.message;
  }
  return {
    kind: "validation",
    formError: "errors.validationFailed",
    fieldErrors,
  };
}
