"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import { ApiError } from "@/lib/api-client";
import {
  getCategories,
  getCurrentEnrollment,
  getReadiness,
  getSummary,
  startEnrollment,
  submitEnrollment,
} from "../../api/enrollment-client";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../lib/session-aware-error";
import type {
  ApplicationResponseDto,
  EnrollmentReadinessResponseDto,
  EnrollmentResponseDto,
  EnrollmentSummaryResponseDto,
  InsuranceCategoryResponseDto,
} from "../types";

/** GET /insurance/categories — the landing page's category list. */
export async function getCategoriesAction(): Promise<
  ActionResult<InsuranceCategoryResponseDto[]>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const categories = await getCategories(token);
    return { ok: true, data: categories };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/**
 * GET /insurance/enrollment/current — null when the patient has none. A 404
 * here is the normal "no active enrollment" case, not an error.
 */
export async function getCurrentEnrollmentAction(): Promise<
  ActionResult<EnrollmentResponseDto | null>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const enrollment = await getCurrentEnrollment(token);
    return { ok: true, data: enrollment };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: null };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** POST /insurance/enrollment/start — begins enrollment for a category. */
export async function startEnrollmentAction(
  insuranceCategoryId: InsuranceCategoryResponseDto["id"],
): Promise<ActionResult<EnrollmentResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  // Trim the untrusted client boundary value so a whitespace-padded id is
  // never POSTed verbatim to the API.
  const categoryId = insuranceCategoryId.trim();

  try {
    const enrollment = await startEnrollment(token, categoryId);
    return { ok: true, data: enrollment };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/**
 * GET /insurance/enrollment/readiness — gates the wizard's Submit step. A 404
 * here is the normal "no enrollment yet" case, not an error.
 */
export async function getReadinessAction(): Promise<
  ActionResult<EnrollmentReadinessResponseDto | null>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const readiness = await getReadiness(token);
    return { ok: true, data: readiness };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: null };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /insurance/enrollment/summary — the review step's snapshot. */
export async function getSummaryAction(): Promise<
  ActionResult<EnrollmentSummaryResponseDto>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const summary = await getSummary(token);
    return { ok: true, data: summary };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** PATCH /insurance/enrollment/submit — moves the draft into review. */
export async function submitEnrollmentAction(): Promise<
  ActionResult<ApplicationResponseDto>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const application = await submitEnrollment(token);
    return { ok: true, data: application };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}
