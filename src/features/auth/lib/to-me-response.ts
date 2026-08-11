import type { AuthResponse, MeResponse } from "../types";

/**
 * Narrow the fields a JWT-issuing endpoint (register/login) returns down to the
 * identity shape `/api/auth/me` provides. Used to seed the `['auth','me']`
 * cache optimistically without waiting for a follow-up `/me` call.
 *
 * Single source of truth for the AuthResponse → MeResponse projection — if the
 * API adds or renames a field, only this function needs to change.
 */
export function toMeResponse(auth: AuthResponse): MeResponse {
  return {
    userId: auth.userId,
    nationalId: auth.nationalId,
    username: auth.username,
    fullName: auth.fullName,
    role: auth.role,
  };
}
