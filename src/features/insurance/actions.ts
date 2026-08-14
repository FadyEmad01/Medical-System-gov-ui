"use server";

import type {
  ActionResult,
  AuthActionError,
} from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import { ApiError } from "@/lib/api-client";
import { getCurrentCard } from "./api/card-client";
import { getProfile, updateProfile } from "./api/profile-client";
import { getInsuranceStatus } from "./api/status-client";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "./lib/session-aware-error";
import type {
  CardResponseDto,
  InsuranceStatusResponseDto,
  MaritalStatus,
  ProfileResponseDto,
  UpdateProfileRequestDto,
} from "./types";

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
  currentCard: CardResponseDto | null;
}

/**
 * Snapshot for the insurance card stepper: application status + current card.
 *
 * The patientId comes from the citizen profile (`ProfileResponseDto`), never
 * from the JWT identity. A missing insurance application surfaces as
 * `status: null` AND `currentCard: null` rather than an error — the stepper
 * just has nothing to show. A 404 from the current-card endpoint is normal
 * (card not issued yet, even after approval).
 */
export async function getCardStateAction(): Promise<
  ActionResult<CardStateData>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const profile = await getProfile(token);
    const [status, currentCard] = await Promise.all([
      getStatusOrNull(profile.patientId, token),
      getCurrentCardOrNull(profile.patientId, token),
    ]);
    return { ok: true, data: { status, currentCard } };
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

/** Likewise a patient with no active card yet has no current card — not an error. */
async function getCurrentCardOrNull(
  patientId: number,
  token: string,
): Promise<CardResponseDto | null> {
  try {
    return await getCurrentCard(patientId, token);
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") return null;
    throw err;
  }
}
