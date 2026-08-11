import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import type { AuthActionError } from "../actions";

/**
 * Map a Server Action error onto React Hook Form fields.
 *
 * Field-keyed messages become field errors; anything else (or a generic
 * `formError`) becomes a root-level error rendered at the top of the form.
 *
 * PascalCase keys from the backend were already normalized to camelCase by
 * `parseProblemDetails`, so they line up with the form schema field names.
 * Unknown keys are skipped — RHF would reject them anyway.
 */
export function applyActionError<T extends FieldValues>(
  raw: unknown,
  form: UseFormReturn<T>,
): void {
  const err = raw as Partial<AuthActionError> | undefined;
  const fieldErrors = err?.fieldErrors ?? {};
  const formError = err?.formError;

  let fieldMapped = false;
  for (const [key, message] of Object.entries(fieldErrors)) {
    if (typeof message !== "string") continue;
    if (!(key in form.getValues())) continue;
    // `Path<T>` is a structural string-template type; we've already verified
    // the key exists on the form, so the cast is safe.
    form.setError(key as FieldPath<T>, { type: "server", message });
    fieldMapped = true;
  }

  // Always surface a root error when the backend gave us one — even if a field
  // was mapped, the form-level message often carries the actionable summary
  // (e.g. "Invalid credentials").
  if (formError) {
    form.setError("root", { type: "server", message: formError });
    return;
  }

  // No formError from backend — synthesize a fallback only if nothing was
  // mapped, so the user is never left with a silent failure.
  if (!fieldMapped) {
    form.setError("root", {
      type: "server",
      message: "errors.requestFailed",
    });
  }
}
