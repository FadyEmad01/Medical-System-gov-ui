"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import { ApiError } from "@/lib/api-client";
import {
  getCardDetail,
  getCardHistory,
  getCurrentCard,
} from "../api/card-client";
import { getProfile } from "../api/profile-client";
import { getInsuranceStatus } from "../api/status-client";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../lib/session-aware-error";
import type {
  CardDetailResponseDto,
  CardResponseDto,
  InsuranceStatusResponseDto,
} from "../types";

interface CardStateData {
  status: InsuranceStatusResponseDto | null;
  currentCard: CardResponseDto | null;
  /** Every card ever held (incl. dependents'), newest first — may be empty. */
  cardHistory: CardResponseDto[];
}

/**
 * Snapshot for the insurance card stepper: application status, current card,
 * and the full card history. The patientId comes from the citizen profile
 * (`ProfileResponseDto`), never from the JWT identity — the backend enforces
 * own-patientId on the history read regardless. A missing insurance
 * application surfaces as `status: null` AND `currentCard: null` rather than
 * an error — the stepper just has nothing to show. A 404 from the
 * current-card endpoint is normal (card not issued yet, even after approval);
 * a 404 history read is equally normal (no cards ever issued).
 */
export async function getCardStateAction(): Promise<
  ActionResult<CardStateData>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const profile = await getProfile(token);
    const [status, currentCard, cardHistory] = await Promise.all([
      getStatusOrNull(profile.patientId, token),
      getCurrentCardOrNull(profile.patientId, token),
      getCardHistoryOrNull(profile.patientId, token),
    ]);
    return { ok: true, data: { status, currentCard, cardHistory } };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/**
 * GET /insurance/cards/detail/{cardId} — one card with its status-change
 * audit trail. The backend scopes access (own/dependent cards for patients,
 * any for Admin), so the id is only ever surfaced from the patient's own
 * history rows.
 */
export async function getCardDetailAction(
  cardId: string,
): Promise<ActionResult<CardDetailResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const id = cardId.trim();
  if (id === "") {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "errors.notFound",
        fieldErrors: {},
      },
    };
  }

  try {
    const detail = await getCardDetail(id, token);
    return { ok: true, data: detail };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
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

/** A patient who never held a card has an empty history — not an error. */
async function getCardHistoryOrNull(
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
