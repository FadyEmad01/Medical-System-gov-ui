"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../../lib/session-aware-error";
import type { CardResponseDto } from "../../../types";
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
} from "../api/card-lifecycle-client";
import {
  bodylessAction,
  invalid,
  reasonAction,
  REPLACEMENT_REASONS,
  trimmed,
} from "../lib/action-helpers";
import type { CardDetailResponseDto, ReplacementReason } from "../types";

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
