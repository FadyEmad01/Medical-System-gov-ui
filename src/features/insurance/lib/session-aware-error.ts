import {
  type AuthActionError,
  toActionError,
} from "@/features/auth/lib/action-error";
import { clearSessionCookie } from "@/features/auth/lib/session-cookie";
import { ApiError } from "@/lib/api-client";

/** Deterministic session-expiry error shared by every insurance action. */
export const SESSION_EXPIRED_ERROR: AuthActionError = {
  kind: "unauthorized",
  formError: "errors.sessionExpired",
  fieldErrors: {},
};

/**
 * 401 (unauthorized) means the session is dead — the cookie is cleared so the
 * client can redirect to login. 403 (forbidden) means the user is
 * authenticated but lacks permission (e.g. a Doctor hitting a patient-only
 * endpoint); the session stays valid, so we report the localized forbidden
 * error without touching the cookie. Any other kind falls through to the
 * generic mapping.
 */
export async function toSessionAwareError(
  err: unknown,
): Promise<AuthActionError> {
  if (err instanceof ApiError && err.kind === "unauthorized") {
    await clearSessionCookie();
    return {
      kind: "unauthorized",
      formError: "errors.sessionExpired",
      fieldErrors: {},
    };
  }
  if (err instanceof ApiError && err.kind === "forbidden") {
    return {
      kind: "forbidden",
      formError: "errors.forbidden",
      fieldErrors: {},
    };
  }
  return toActionError(err);
}
