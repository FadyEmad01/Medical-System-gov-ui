"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import { ApiError } from "@/lib/api-client";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../lib/session-aware-error";
import { checkEligibility, getEligibility } from "../api/verification-client";
import { ELIGIBILITY_STATUSES } from "../lib/constants";
import {
  invalid,
  REASON_MAX,
  REMARKS_MAX,
  validPatient,
} from "../lib/action-helpers";
import type {
  CheckEligibilityInput,
  InsuranceEligibilityResponseDto,
} from "../types";

export async function checkEligibilityAction(
  input: CheckEligibilityInput,
): Promise<ActionResult<InsuranceEligibilityResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const reason = input.reason.trim();
  const remarks = input.remarks.trim();
  if (
    !ELIGIBILITY_STATUSES.includes(input.status) ||
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
    const record = await checkEligibility(token, {
      ...input,
      reason,
      remarks,
    });
    return { ok: true, data: record };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /eligibility/{patientId} — null when no record / no access (404). */
export async function getEligibilityAction(
  patientId: number,
): Promise<ActionResult<InsuranceEligibilityResponseDto | null>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validPatient(patientId))
    return invalid("verification.errors.invalidInput");

  try {
    return { ok: true, data: await getEligibility(token, patientId) };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: null };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}
