import type { AuthActionError } from "@/features/auth/lib/action-error";

/**
 * The clinical endpoints are LIVE on staging (probed 2026-08-28; shapes in
 * api/clinical-client.ts + docs/backend-gaps-doctor-clinical.md). This flag
 * remains as the kill-switch: flipping it to false renders every clinical
 * section in its "awaiting backend" state without any other change.
 */
export const CLINICAL_API_AVAILABLE = true;

/** Stable translation key surfaces as the pending notice copy. */
export const PENDING_BACKEND_FORM_ERROR = "doctor.errors.pendingBackend";

export function pendingBackendError(_featureKey: string): AuthActionError {
  return {
    kind: "notFound",
    formError: PENDING_BACKEND_FORM_ERROR,
    fieldErrors: {},
  };
}

export function isPendingBackendError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "formError" in error &&
    error.formError === PENDING_BACKEND_FORM_ERROR
  );
}
