"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import type { ApplicationResponseDto } from "../../../enrollment/types";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../../lib/session-aware-error";
import {
  approveApplication,
  backToReview,
  rejectApplication,
  requestDocuments,
} from "../api/review-actions-client";
import { optionalTrimmed } from "../lib/action-helpers";
import { validateDecision } from "../lib/decision-validation";
import type { DecisionInput } from "../types";

/** PATCH /applications/{id}/approve — cards are issued automatically on success. */
export async function approveApplicationAction(
  applicationId: string,
  input: { citizenVisibleReason?: string; internalNotes?: string },
): Promise<ActionResult<ApplicationResponseDto>> {
  return decide(
    applicationId,
    input,
    { requireReason: false },
    (token, id, decision) => approveApplication(token, id, decision),
  );
}

/** PATCH /applications/{id}/reject — a citizen-facing reason is mandatory. */
export async function rejectApplicationAction(
  applicationId: string,
  input: { citizenVisibleReason?: string; internalNotes?: string },
): Promise<ActionResult<ApplicationResponseDto>> {
  return decide(
    applicationId,
    input,
    { requireReason: true },
    (token, id, decision) => rejectApplication(token, id, decision),
  );
}

/** PATCH /applications/{id}/request-documents — reason mandatory. */
export async function requestDocumentsAction(
  applicationId: string,
  input: { citizenVisibleReason?: string; internalNotes?: string },
): Promise<ActionResult<ApplicationResponseDto>> {
  return decide(
    applicationId,
    input,
    { requireReason: true },
    (token, id, decision) => requestDocuments(token, id, decision),
  );
}

/** PATCH /applications/{id}/back-to-review — bodyless. */
export async function backToReviewAction(
  applicationId: string,
): Promise<ActionResult<ApplicationResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const application = await backToReview(token, applicationId.trim());
    return { ok: true, data: application };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

async function decide(
  applicationId: string,
  input: { citizenVisibleReason?: string; internalNotes?: string },
  options: { requireReason: boolean },
  call: (
    token: string,
    id: string,
    decision: DecisionInput,
  ) => Promise<ApplicationResponseDto>,
): Promise<ActionResult<ApplicationResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const parsed = validateDecision(
    {
      citizenVisibleReason: optionalTrimmed(input.citizenVisibleReason),
      internalNotes: optionalTrimmed(input.internalNotes),
    },
    options,
  );
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const application = await call(token, applicationId.trim(), parsed.data);
    return { ok: true, data: application };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}
