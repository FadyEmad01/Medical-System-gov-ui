"use client";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { useActionQuery } from "../../hooks/use-action-query";
import {
  getApplicationDetailAction,
  getApplicationsAction,
  getCategoriesAction,
  getCurrentEnrollmentAction,
  getDependentsAction,
  getDocumentsAction,
  getReadinessAction,
  getStatusAction,
  getSummaryAction,
} from "../actions";
import {
  APPLICATION_DETAIL_QUERY_KEY,
  APPLICATIONS_QUERY_KEY,
  CATEGORIES_QUERY_KEY,
  CURRENT_ENROLLMENT_QUERY_KEY,
  DEPENDENTS_QUERY_KEY,
  DOCUMENTS_QUERY_KEY,
  READINESS_QUERY_KEY,
  STATUS_QUERY_KEY,
  SUMMARY_QUERY_KEY,
} from "./query-keys";

function useInsuranceActionQuery<T>(
  queryKey: readonly unknown[],
  action: () => Promise<ActionResult<T>>,
  options: { enabled?: boolean } = {},
) {
  return useActionQuery(queryKey, action, options);
}

/** Insurance categories for the enrollment landing page. */
export function useCategories() {
  return useInsuranceActionQuery(CATEGORIES_QUERY_KEY, getCategoriesAction);
}

/**
 * The patient's active enrollment; `null` means they have none yet and can
 * start one from the landing page.
 */
export function useCurrentEnrollment() {
  return useInsuranceActionQuery(
    CURRENT_ENROLLMENT_QUERY_KEY,
    getCurrentEnrollmentAction,
  );
}

/**
 * The enrollment readiness gate; `null` when the patient has no enrollment.
 * Drives the wizard's resume step and the review Submit gate.
 */
export function useReadiness() {
  return useInsuranceActionQuery(READINESS_QUERY_KEY, getReadinessAction);
}

/** The complete enrollment snapshot the review step renders. */
export function useSummary() {
  return useInsuranceActionQuery(SUMMARY_QUERY_KEY, getSummaryAction);
}

/**
 * The patient's uploaded documents (empty when none). Disabled until the
 * wizard knows the patient ID from the loaded profile.
 */
export function useDocuments(patientId: number | null) {
  return useInsuranceActionQuery(
    DOCUMENTS_QUERY_KEY(patientId ?? 0),
    () => getDocumentsAction(patientId ?? 0),
    { enabled: patientId !== null },
  );
}

/** The patient's dependents (empty when none). */
export function useDependents(patientId: number | null) {
  return useInsuranceActionQuery(
    DEPENDENTS_QUERY_KEY(patientId ?? 0),
    () => getDependentsAction(patientId ?? 0),
    { enabled: patientId !== null },
  );
}

/**
 * The patient's application status snapshot; `null` when they have no
 * application yet.
 */
export function useStatus(patientId: number | null | undefined) {
  return useInsuranceActionQuery(
    STATUS_QUERY_KEY(patientId ?? 0),
    () => getStatusAction(patientId ?? 0),
    { enabled: patientId != null },
  );
}

/** One application's detail record with its review history. */
export function useApplicationDetail(
  applicationId: string,
  options: { enabled?: boolean } = {},
) {
  return useInsuranceActionQuery(
    APPLICATION_DETAIL_QUERY_KEY(applicationId),
    () => getApplicationDetailAction(applicationId),
    options,
  );
}

/**
 * The patient's full application history, newest first — feeding the tracking
 * page's past-applications list.
 */
export function useApplications(patientId: number | null | undefined) {
  return useInsuranceActionQuery(
    APPLICATIONS_QUERY_KEY(patientId ?? 0),
    () => getApplicationsAction(patientId ?? 0),
    { enabled: patientId != null },
  );
}
