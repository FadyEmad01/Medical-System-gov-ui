import "server-only";

import { cookies } from "next/headers";
import { isProduction } from "@/lib/env";
import type { AuthResponse } from "../types";
import { SESSION_COOKIE_NAME } from "./session-constants";

export { SESSION_COOKIE_NAME };

const COOKIE_OPTIONS = {
  path: "/",
  secure: isProduction,
  httpOnly: true,
  sameSite: "lax" as const,
} as const;

/**
 * Persist the JWT from an auth response as an httpOnly cookie.
 * Expiry mirrors the backend's `expiresAtUtc` so the cookie dies with the token.
 *
 * Must be called from a Server Action or Route Handler — `cookies().set()` is a
 * response-time API and will throw if invoked during Server Component render.
 */
export async function setSessionCookie(auth: AuthResponse): Promise<void> {
  const store = await cookies();
  const expires = parseExpiry(auth.expiresAtUtc);
  store.set(SESSION_COOKIE_NAME, auth.token, {
    ...COOKIE_OPTIONS,
    expires,
  });
}

/** Remove the session cookie immediately (logout, post-401, etc.). */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

/**
 * Read the raw JWT from the incoming request cookies.
 * Returns `null` when absent — callers (Server Actions, Server Components) decide
 * what to do with that. Do NOT log the value.
 */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE_NAME);
  return cookie?.value ?? null;
}

function parseExpiry(expiresAtUtc: string): Date | undefined {
  const date = new Date(expiresAtUtc);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
