"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import { ApiError } from "@/lib/api-client";
import { getProfile, updateProfile } from "../api/profile-client";
import { parseUpdateProfileInput } from "../lib/parse-update-profile";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../lib/session-aware-error";
import type { ProfileResponseDto, UpdateProfileRequestDto } from "../types";

/**
 * GET /profile for the authenticated patient.
 *
 * A missing/expired session clears the cookie and reports a localized
 * session-expired error; a missing profile is a real failure (notFound), not
 * an empty success.
 */
export async function getProfileAction(): Promise<
  ActionResult<ProfileResponseDto | null>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const profile = await getProfile(token);
    return { ok: true, data: profile };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return {
        ok: false,
        error: {
          kind: "notFound",
          formError: "errors.notFound",
          fieldErrors: {},
        },
      };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/**
 * PUT /profile — updates the six editable profile fields.
 *
 * Input is parsed at the boundary: maritalStatus must be a known enum value,
 * strings are trimmed, and empty optional strings become `null` (backend
 * semantics: `null`/omitted clears the field).
 */
export async function updateProfileAction(
  input: UpdateProfileRequestDto,
): Promise<ActionResult<ProfileResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const parsed = parseUpdateProfileInput(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const profile = await updateProfile(token, parsed.data);
    return { ok: true, data: profile };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}
