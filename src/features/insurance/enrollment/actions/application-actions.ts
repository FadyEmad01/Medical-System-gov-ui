"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import { ApiError } from "@/lib/api-client";
import {
  cancelApplication,
  getApplicationDetail,
  getApplications,
} from "../../api/applications-client";
import { getInsuranceStatus } from "../../api/status-client";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../lib/session-aware-error";
import type { InsuranceStatusResponseDto } from "../../types";
import type {
  ApplicationDetailResponseDto,
  ApplicationResponseDto,
} from "../types";

/**
 * GET /insurance/status/{patientId} — null when the patient has no
 * application yet. A 404 here is the normal "nothing to track" case, not an
 * error.
 */
export async function getStatusAction(
  patientId: number,
): Promise<ActionResult<InsuranceStatusResponseDto | null>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const status = await getInsuranceStatus(patientId, token);
    return { ok: true, data: status };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: null };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /insurance/applications/{patientId} — all applications, newest first. */
export async function getApplicationsAction(
  patientId: number,
): Promise<ActionResult<ApplicationResponseDto[]>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const applications = await getApplications(patientId, token);
    return { ok: true, data: applications };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /insurance/applications/detail/{applicationId}. */
export async function getApplicationDetailAction(
  applicationId: string,
): Promise<ActionResult<ApplicationDetailResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const detail = await getApplicationDetail(token, applicationId);
    return { ok: true, data: detail };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** PATCH /insurance/applications/{applicationId}/cancel. */
export async function cancelApplicationAction(
  applicationId: string,
): Promise<ActionResult<ApplicationResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const application = await cancelApplication(token, applicationId);
    return { ok: true, data: application };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}
