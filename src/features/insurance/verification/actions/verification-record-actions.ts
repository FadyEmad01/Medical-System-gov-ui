"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import { ApiError } from "@/lib/api-client";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../lib/session-aware-error";
import {
  getCurrentVerification,
  getLatestVerification,
  getVerificationHistory,
  recordVerification,
} from "../api/verification-client";
import {
  VERIFICATION_CONTEXTS,
  VERIFICATION_STATUSES,
} from "../lib/constants";
import {
  invalid,
  REASON_MAX,
  REMARKS_MAX,
  validPatient,
} from "../lib/action-helpers";
import type {
  InsuranceVerificationResponseDto,
  VerifyInsuranceInput,
} from "../types";

export async function recordVerificationAction(
  input: VerifyInsuranceInput,
): Promise<ActionResult<InsuranceVerificationResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const reason = input.reason.trim();
  const remarks = input.remarks.trim();
  if (
    !VERIFICATION_STATUSES.includes(input.status) ||
    !VERIFICATION_CONTEXTS.includes(input.context) ||
    !Number.isInteger(input.patientId) ||
    input.patientId < 1
  ) {
    return invalid("verification.errors.invalidInput");
  }
  if (reason === "" || reason.length > REASON_MAX)
    return invalid("verification.errors.reason");
  if (remarks.length > REMARKS_MAX)
    return invalid("verification.errors.remarks");

  try {
    const record = await recordVerification(token, {
      ...input,
      reason,
      remarks,
    });
    return { ok: true, data: record };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /verification/current/{patientId} — null when none currently valid. */
export async function getCurrentVerificationAction(
  patientId: number,
): Promise<ActionResult<InsuranceVerificationResponseDto | null>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validPatient(patientId))
    return invalid("verification.errors.invalidInput");

  try {
    return { ok: true, data: await getCurrentVerification(token, patientId) };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: null };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /verification/{patientId}/latest — null when none exists. */
export async function getLatestVerificationAction(
  patientId: number,
): Promise<ActionResult<InsuranceVerificationResponseDto | null>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validPatient(patientId))
    return invalid("verification.errors.invalidInput");

  try {
    return { ok: true, data: await getLatestVerification(token, patientId) };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: null };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /verification/{patientId}/history — [] when none / inaccessible. */
export async function getVerificationHistoryAction(
  patientId: number,
): Promise<ActionResult<InsuranceVerificationResponseDto[]>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validPatient(patientId))
    return invalid("verification.errors.invalidInput");

  try {
    return { ok: true, data: await getVerificationHistory(token, patientId) };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: [] };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}
