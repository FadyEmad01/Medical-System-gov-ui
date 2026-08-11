"use server";

import type { z } from "zod";
import { ApiError, type ApiErrorKind } from "@/lib/api-client";
import { parseProblemDetails } from "@/lib/problem-details";
import {
  fetchCurrentUser,
  loginWithCredentials,
  registerPatient,
} from "./api/auth-client";
import {
  clearSessionCookie,
  getSessionToken,
  setSessionCookie,
} from "./lib/session-cookie";
import type {
  AuthResponse,
  LoginRequest,
  MeResponse,
  RegisterRequest,
} from "./types";
import {
  loginActionInputSchema,
  registerActionInputSchema,
} from "./validation/action-inputs";

/**
 * Structured error returned by every auth action.
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

export async function loginAction(
  input: LoginRequest,
): Promise<ActionResult<AuthResponse>> {
  const parsed = loginActionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: toValidationError(parsed.error) };
  }

  try {
    const auth = await loginWithCredentials(parsed.data);
    await setSessionCookie(auth);
    return { ok: true, data: auth };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}

export async function registerAction(
  input: RegisterRequest,
): Promise<ActionResult<AuthResponse>> {
  const parsed = registerActionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: toValidationError(parsed.error) };
  }

  try {
    const auth = await registerPatient(parsed.data);
    await setSessionCookie(auth);
    return { ok: true, data: auth };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}

/** Clears the session cookie. The JWT itself is not server-side revocable. */
export async function logoutAction(): Promise<ActionResult<true>> {
  await clearSessionCookie();
  return { ok: true, data: true };
}

/**
 * Returns the current user's identity, or `null` when no session exists.
 *
 * Stale/expired tokens are treated as "no session": we clear the cookie and
 * return `null` so the client can silently move the user to the login screen.
 * Network and 5xx errors surface as a real failure so the UI can offer retry.
 */
export async function meAction(): Promise<ActionResult<MeResponse | null>> {
  const token = await getSessionToken();
  if (!token) return { ok: true, data: null };

  try {
    const me = await fetchCurrentUser(token);
    return { ok: true, data: me };
  } catch (err) {
    if (
      err instanceof ApiError &&
      (err.kind === "unauthorized" || err.kind === "forbidden")
    ) {
      await clearSessionCookie();
      return { ok: true, data: null };
    }
    return { ok: false, error: toActionError(err) };
  }
}

function toActionError(err: unknown): AuthActionError {
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
function toValidationError(error: z.ZodError): AuthActionError {
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
