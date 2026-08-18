"use server";

import type {
  ActionResult,
  AuthActionError,
} from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../lib/session-aware-error";
import type {
  InsuranceEligibilityResponseDto,
  InsuranceVerificationResponseDto,
} from "../review/types";
import {
  checkEligibility,
  recordVerification,
  verifyCard,
} from "./api/verification-client";
import {
  ELIGIBILITY_STATUSES,
  VERIFICATION_CONTEXTS,
  VERIFICATION_STATUSES,
} from "./lib/constants";
import type {
  CardVerificationResultDto,
  CheckEligibilityInput,
  VerifyInsuranceInput,
} from "./types";

/** Server actions for the Admin verification surface (phase 4). */

const REASON_MAX = 1000;
const REMARKS_MAX = 2000;

function invalid(formError: string): { ok: false; error: AuthActionError } {
  return {
    ok: false,
    error: { kind: "validation", formError, fieldErrors: {} },
  };
}

/** POST /cards/verify — scans the QR/token payload. */
export async function verifyCardAction(
  verificationToken: string,
): Promise<ActionResult<CardVerificationResultDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const scanned = verificationToken.trim();
  if (scanned === "" || scanned.length > 500) {
    return invalid("verification.errors.invalidToken");
  }

  try {
    const result = await verifyCard(token, scanned);
    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

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
