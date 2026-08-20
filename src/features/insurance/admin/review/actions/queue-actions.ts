"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import type { ApplicationDetailResponseDto } from "../../../enrollment/types";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../../lib/session-aware-error";
import type { ApplicationStatus } from "../../../types";
import {
  getApplicationByNumber,
  getApplicationQueue,
  getReviewDetail,
  type QueueQuery,
} from "../api/applications-queue-client";
import { clampPage, clampPageSize, QUEUE_STATUSES } from "../lib/queue-filters";
import type {
  ApplicationQueueResult,
  ApplicationReviewDetailResponseDto,
} from "../types";

/**
 * Server actions for the Admin application-review queue / read surface.
 * Session token from the cookie, boundary validation of untrusted input,
 * structured errors, no Error instances across the RSC boundary.
 */

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
