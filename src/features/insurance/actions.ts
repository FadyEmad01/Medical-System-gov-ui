"use server";

import {
  type ActionResult,
  type AuthActionError,
  toActionError,
} from "@/features/auth/lib/action-error";
import {
  clearSessionCookie,
  getSessionToken,
} from "@/features/auth/lib/session-cookie";
import { ApiError } from "@/lib/api-client";
import { getCardHistory } from "./api/card-client";
import { getProfile, updateProfile } from "./api/profile-client";
import { getInsuranceStatus } from "./api/status-client";
import type {
  CardResponseDto,
  InsuranceStatusResponseDto,
  MaritalStatus,
  ProfileResponseDto,
  UpdateProfileRequestDto,
} from "./types";

const SESSION_EXPIRED_ERROR: AuthActionError = {
  kind: "unauthorized",
  formError: "errors.sessionExpired",
  fieldErrors: {},
};

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

interface CardStateData {
  status: InsuranceStatusResponseDto | null;
  cards: CardResponseDto[];
}

/**
 * Snapshot for the insurance card stepper: application status + card history.
 *
 * The patientId comes from the citizen profile (`ProfileResponseDto`), never
 * from the JWT identity. A missing insurance application surfaces as
 * `status: null` rather than an error — the stepper just has nothing to show.
 */
export async function getCardStateAction(): Promise<
  ActionResult<CardStateData>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const profile = await getProfile(token);
    const [status, cards] = await Promise.all([
      getStatusOrNull(profile.patientId, token),
      getCardsOrEmpty(profile.patientId, token),
    ]);
    return { ok: true, data: { status, cards } };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

const MARITAL_STATUS_VALUES: readonly MaritalStatus[] = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
];

function parseUpdateProfileInput(
  input: UpdateProfileRequestDto,
):
  | { ok: true; data: UpdateProfileRequestDto }
  | { ok: false; error: AuthActionError } {
  if (!MARITAL_STATUS_VALUES.includes(input.maritalStatus)) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "errors.generic",
        fieldErrors: {},
      },
    };
  }

  return {
    ok: true,
    data: {
      maritalStatus: input.maritalStatus,
      occupation: normalizeNullableString(input.occupation),
      nationality: normalizeNullableString(input.nationality),
      preferredLanguage: normalizeNullableString(input.preferredLanguage),
      emergencyContactName: normalizeNullableString(input.emergencyContactName),
      emergencyContactPhone: normalizeNullableString(
        input.emergencyContactPhone,
      ),
    },
  };
}

function normalizeNullableString(
  value: string | null | undefined,
): string | null | undefined {
  if (value === null || value === undefined) return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * 401 (unauthorized) means the session is dead — the cookie is cleared so the
 * client can redirect to login. 403 (forbidden) means the user is
 * authenticated but lacks permission (e.g. a Doctor hitting a patient-only
 * endpoint); the session stays valid, so we report the localized forbidden
 * error without touching the cookie. Any other kind falls through to the
 * generic mapping.
 */
async function toSessionAwareError(err: unknown): Promise<AuthActionError> {
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

/** A patient without an insurance application yet has no status — not an error. */
async function getStatusOrNull(
  patientId: number,
  token: string,
): Promise<InsuranceStatusResponseDto | null> {
  try {
    return await getInsuranceStatus(patientId, token);
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") return null;
    throw err;
  }
}

/** Likewise an empty card history is a valid state. */
async function getCardsOrEmpty(
  patientId: number,
  token: string,
): Promise<CardResponseDto[]> {
  try {
    return await getCardHistory(patientId, token);
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") return [];
    throw err;
  }
}
