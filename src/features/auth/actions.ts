"use server";

import { ApiError } from "@/lib/api-client";
import {
  fetchCurrentUser,
  loginWithCredentials,
  registerPatient,
} from "./api/auth-client";
import {
  type ActionResult,
  toActionError,
  toValidationError,
} from "./lib/action-error";
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
