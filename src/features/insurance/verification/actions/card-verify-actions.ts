"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../lib/session-aware-error";
import { verifyCard } from "../api/verification-client";
import { invalid } from "../lib/action-helpers";
import type { CardVerificationResultDto } from "../types";

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
