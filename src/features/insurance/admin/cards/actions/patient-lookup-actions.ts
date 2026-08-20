"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import { ApiError } from "@/lib/api-client";
import {
  getApplicationDetail,
  getApplications,
} from "../../../api/applications-client";
import { getCurrentCard } from "../../../api/card-client";
import { getInsuranceStatus } from "../../../api/status-client";
import type {
  ApplicationDetailResponseDto,
  ApplicationResponseDto,
} from "../../../enrollment/types";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../../lib/session-aware-error";
import type { CardResponseDto, InsuranceStatusResponseDto } from "../../../types";
import { invalid, trimmed, validPatient } from "../lib/action-helpers";

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
