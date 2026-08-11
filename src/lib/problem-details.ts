/**
 * RFC 7807 Problem Details — generic shape returned by ASP.NET Core (and any
 * compliant API) on error responses.
 *
 * Lives in `lib/` (not `features/auth/`) because it is not auth-specific: any
 * backend endpoint can return this envelope, and the parser is pure RFC logic.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  /** Per-field messages. Only present on 400 validation failures. */
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface ParsedApiError {
  /** Field-keyed messages, names normalized to match the form schema (camelCase). */
  fieldErrors: Record<string, string>;
  /** Generic message for the form root (used when no specific field is at fault). */
  formError?: string;
}

/**
 * Convert a Problem Details object into a shape that maps cleanly onto React
 * Hook Form's `setError(field, { message })` plus a root-level message.
 *
 * The backend emits PascalCase property names in `errors` (ASP.NET Core default),
 * so each key is normalized to camelCase to align with the form schemas. When a
 * field has multiple messages they are joined with a space — the form only has
 * one error slot per field, and surfacing all of them is more useful than
 * truncating to the first.
 */
export function parseProblemDetails(problem: ProblemDetails): ParsedApiError {
  const fieldErrors: Record<string, string> = {};

  if (problem.errors) {
    for (const [rawField, messages] of Object.entries(problem.errors)) {
      if (!messages?.length) continue;
      fieldErrors[toCamelCase(rawField)] = messages.join(" ");
    }
  }

  const formError = problem.detail ?? problem.title ?? "errors.requestFailed";

  return { fieldErrors, formError };
}

function toCamelCase(key: string): string {
  if (!key) return key;
  return key.charAt(0).toLowerCase() + key.slice(1);
}
