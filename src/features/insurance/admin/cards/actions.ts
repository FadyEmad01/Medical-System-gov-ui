"use server";

import type {
  ActionResult,
  AuthActionError,
} from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import { ApiError } from "@/lib/api-client";
import {
  getApplicationDetail,
  getApplications,
} from "../../api/applications-client";
import { getCurrentCard } from "../../api/card-client";
import { getInsuranceStatus } from "../../api/status-client";
import type {
  ApplicationDetailResponseDto,
  ApplicationResponseDto,
} from "../../enrollment/types";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../lib/session-aware-error";
import type { CardResponseDto, InsuranceStatusResponseDto } from "../../types";
import {
  getCardDetail,
  getCardHistory,
  issueCards,
  reactivateCard,
  renewCard,
  replaceCard,
  revokeCard,
  rotateCardToken,
  suspendCard,
} from "./api/card-lifecycle-client";
import { validateCardReason } from "./lib/card-reason-validation";
import type { CardDetailResponseDto, ReplacementReason } from "./types";

/**
 * Server actions for the Admin card lifecycle. Same discipline as phase 1:
 * cookie token, boundary validation, structured errors.
 */

const REPLACEMENT_REASONS: readonly ReplacementReason[] = [
  "Lost",
  "Damaged",
  "Stolen",
  "Other",
];

function trimmed(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/** GET /cards/{patientId} — the full card history, newest first. */
export async function getCardHistoryAction(
  patientId: number,
): Promise<ActionResult<CardResponseDto[]>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  if (!Number.isInteger(patientId) || patientId < 1) {
    return invalid("admin.cards.errors.invalidPatientId");
  }

  try {
    const cards = await getCardHistory(token, patientId);
    return { ok: true, data: cards };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /cards/detail/{cardId} — card + status-change audit trail. */
export async function getCardDetailAction(
  cardId: string,
): Promise<ActionResult<CardDetailResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const id = trimmed(cardId);
  if (id === "") return invalid("admin.cards.errors.invalidCardId");

  try {
    const detail = await getCardDetail(token, id);
    return { ok: true, data: detail };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/**
 * POST /cards/issue/{applicationId} — manual fallback when approve's
 * auto-issue did not create cards.
 */
export async function issueCardsAction(
  applicationId: string,
): Promise<ActionResult<CardResponseDto[]>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const id = trimmed(applicationId);
  if (id === "") return invalid("admin.cards.errors.invalidApplicationId");

  try {
    const cards = await issueCards(token, id);
    return { ok: true, data: cards };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

export async function suspendCardAction(
  cardId: string,
  reason: string,
): Promise<ActionResult<CardResponseDto>> {
  return reasonAction(cardId, reason, true, suspendCard);
}

export async function revokeCardAction(
  cardId: string,
  reason: string,
): Promise<ActionResult<CardResponseDto>> {
  return reasonAction(cardId, reason, true, revokeCard);
}

export async function renewCardAction(
  cardId: string,
  reason: string,
): Promise<ActionResult<CardResponseDto>> {
  return reasonAction(cardId, reason, false, renewCard);
}

export async function reactivateCardAction(
  cardId: string,
): Promise<ActionResult<CardResponseDto>> {
  return bodylessAction(cardId, reactivateCard);
}

export async function rotateCardTokenAction(
  cardId: string,
): Promise<ActionResult<CardResponseDto>> {
  return bodylessAction(cardId, rotateCardToken);
}

export async function replaceCardAction(
  cardId: string,
  input: { replacementReason: string; reasonNote?: string },
): Promise<ActionResult<CardResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const id = trimmed(cardId);
  if (
    !REPLACEMENT_REASONS.includes(input.replacementReason as ReplacementReason)
  ) {
    return invalid("admin.cards.errors.invalidReplacementReason");
  }
  const note = trimmed(input.reasonNote);
  if (note.length > 1000) {
    return invalid("admin.cards.errors.noteTooLong");
  }

  try {
    const card = await replaceCard(token, id, {
      replacementReason: input.replacementReason as ReplacementReason,
      reasonNote: note,
    });
    return { ok: true, data: card };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

function validPatient(patientId: number): boolean {
  return Number.isInteger(patientId) && patientId >= 1;
}

/** GET /cards/current/{patientId} — null when none is currently valid. */
export async function getCurrentCardAction(
  patientId: number,
): Promise<ActionResult<CardResponseDto | null>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validPatient(patientId))
    return invalid("admin.cards.errors.invalidPatientId");

  try {
    return { ok: true, data: await getCurrentCard(patientId, token) };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: null };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /status/{patientId} — null when the patient has no insurance record. */
export async function getPatientStatusAction(
  patientId: number,
): Promise<ActionResult<InsuranceStatusResponseDto | null>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validPatient(patientId))
    return invalid("admin.cards.errors.invalidPatientId");

  try {
    return { ok: true, data: await getInsuranceStatus(patientId, token) };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: null };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /applications/{patientId} — newest first. */
export async function getPatientApplicationsAction(
  patientId: number,
): Promise<ActionResult<ApplicationResponseDto[]>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validPatient(patientId))
    return invalid("admin.cards.errors.invalidPatientId");

  try {
    const applications = await getApplications(patientId, token);
    return { ok: true, data: applications };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /applications/detail/{applicationId} — includes review history. */
export async function getPatientApplicationDetailAction(
  applicationId: string,
): Promise<ActionResult<ApplicationDetailResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const id = trimmed(applicationId);
  if (id === "") return invalid("admin.cards.errors.invalidApplicationId");

  try {
    const detail = await getApplicationDetail(token, id);
    return { ok: true, data: detail };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

function invalid(formError: string): { ok: false; error: AuthActionError } {
  return {
    ok: false,
    error: { kind: "validation", formError, fieldErrors: {} },
  };
}

async function reasonAction(
  cardId: string,
  reason: string,
  required: boolean,
  call: (
    token: string,
    cardId: string,
    reason: string,
  ) => Promise<CardResponseDto>,
): Promise<ActionResult<CardResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const parsed = validateCardReason(trimmed(reason), { required });
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const card = await call(token, trimmed(cardId), parsed.data);
    return { ok: true, data: card };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

async function bodylessAction(
  cardId: string,
  call: (token: string, cardId: string) => Promise<CardResponseDto>,
): Promise<ActionResult<CardResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const card = await call(token, trimmed(cardId));
    return { ok: true, data: card };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}
