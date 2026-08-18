"use server";

import type {
  ActionResult,
  AuthActionError,
} from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import type {
  ApplicationDetailResponseDto,
  ApplicationResponseDto,
} from "../../enrollment/types";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../lib/session-aware-error";
import type { ApplicationStatus } from "../../types";
import {
  getApplicationByNumber,
  getApplicationQueue,
  getReviewDetail,
  type QueueQuery,
} from "./api/applications-queue-client";
import {
  approveApplication,
  backToReview,
  rejectApplication,
  requestDocuments,
} from "./api/review-actions-client";
import { validateDecision } from "./lib/decision-validation";
import { clampPage, clampPageSize, QUEUE_STATUSES } from "./lib/queue-filters";
import type {
  ApplicationQueueResult,
  ApplicationReviewDetailResponseDto,
  DecisionInput,
} from "./types";

/**
 * Server actions for the Admin application-review surface. Same discipline as
 * the citizen actions: session token from the cookie, boundary validation of
 * untrusted input, structured errors, no Error instances across the RSC
 * boundary.
 */

function optionalTrimmed(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/** GET /insurance/applications — the paged, status-filterable queue. */
export async function getApplicationQueueAction(
  query: QueueQuery = {},
): Promise<ActionResult<ApplicationQueueResult>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  // Boundary-clamp everything; a bogus status reads as "all".
  const status = QUEUE_STATUSES.includes(query.status as ApplicationStatus)
    ? (query.status as ApplicationStatus)
    : undefined;

  try {
    const result = await getApplicationQueue(token, {
      ...(status ? { status } : {}),
      page: clampPage(query.page ?? 1),
      pageSize: clampPageSize(query.pageSize ?? 20),
    });
    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/**
 * GET /insurance/applications/{applicationId}/review — the decision bundle.
 *
 * SIDE EFFECT: auto-claims a Submitted application (advances to UnderReview).
 * Only the review screen may invoke this; never prefetch.
 */
export async function getReviewDetailAction(
  applicationId: string,
): Promise<ActionResult<ApplicationReviewDetailResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const id = applicationId.trim();
  if (id === "") {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "admin.errors.invalidId",
        fieldErrors: {},
      },
    };
  }

  try {
    const detail = await getReviewDetail(token, id);
    return { ok: true, data: detail };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /applications/by-number/{applicationNumber} — printed-reference lookup. */
export async function getApplicationByNumberAction(
  applicationNumber: string,
): Promise<ActionResult<ApplicationDetailResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const number = applicationNumber.trim();
  if (number === "") {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "admin.errors.invalidNumber",
        fieldErrors: {},
      },
    };
  }

  try {
    const detail = await getApplicationByNumber(token, number);
    return { ok: true, data: detail };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

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
