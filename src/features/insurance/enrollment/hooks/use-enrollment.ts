"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import type {
  ActionResult,
  AuthActionError,
} from "@/features/auth/lib/action-error";
import { useRouter } from "@/i18n/navigation";
import {
  handleSessionExpiry,
  isAuthActionError,
  isForbidden,
  isTerminalActionError,
} from "../../hooks/session-guard";
import {
  addDependentAction,
  cancelApplicationAction,
  endDependentAction,
  getApplicationDetailAction,
  getCategoriesAction,
  getCurrentEnrollmentAction,
  getDependentsAction,
  getDocumentsAction,
  getReadinessAction,
  getStatusAction,
  getSummaryAction,
  submitEnrollmentAction,
  uploadDocumentAction,
} from "../actions";
import type {
  AddDependentRequestDto,
  ApplicationResponseDto,
  CitizenDocumentResponseDto,
  DependentResponseDto,
  UploadDocumentInput,
} from "../types";

/** Cache key for the insurance categories a patient can apply for. */
export const CATEGORIES_QUERY_KEY = ["insurance", "categories"] as const;

/** Cache key for the patient's active enrollment (null when none). */
export const CURRENT_ENROLLMENT_QUERY_KEY = [
  "insurance",
  "enrollment",
  "current",
] as const;

/** Cache key for the enrollment readiness gate. */
export const READINESS_QUERY_KEY = [
  "insurance",
  "enrollment",
  "readiness",
] as const;

/** Cache key for the review step's full enrollment snapshot. */
export const SUMMARY_QUERY_KEY = [
  "insurance",
  "enrollment",
  "summary",
] as const;

/** Cache key for a patient's uploaded documents. */
export const DOCUMENTS_QUERY_KEY = (patientId: number) =>
  ["insurance", "documents", patientId] as const;

/** Cache key for a patient's dependents. */
export const DEPENDENTS_QUERY_KEY = (patientId: number) =>
  ["insurance", "dependents", patientId] as const;

/** Cache key for one application's detail record. */
export const APPLICATION_DETAIL_QUERY_KEY = (applicationId: string) =>
  ["insurance", "applications", applicationId] as const;

/** Cache key for a patient's application status snapshot. */
export const STATUS_QUERY_KEY = (patientId: number) =>
  ["insurance", "status", patientId] as const;

/**
 * Shared shape for every insurance read hook: normalize the action's
 * `ActionResult` so react-query's error state holds the structured
 * `AuthActionError`, skip deterministic retries, and watch the error state so
 * a dead session drops the identity cache and lets AuthGuard redirect.
 */
function useInsuranceActionQuery<T>(
  queryKey: readonly unknown[],
  action: () => Promise<ActionResult<T>>,
  options: { enabled?: boolean } = {},
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await action();
      if (!res.ok) throw res.error;
      return res.data;
    },
    staleTime: 60_000,
    // Deterministic action errors won't heal; retrying a dead session would
    // re-clear the cookie and delay the AuthGuard redirect, and retrying a
    // forbidden request just repeats the same failed permission check.
    retry: (failureCount, error) =>
      !(isAuthActionError(error) && isTerminalActionError(error)) &&
      failureCount < 1,
    ...(options.enabled === undefined ? {} : { enabled: options.enabled }),
  });

  // v5 dropped query-level `onError`; watch the error state so a dead session
  // drops the identity cache and lets AuthGuard redirect immediately. Load
  // errors surface in the page's persistent inline Alert — no toast here —
  // and a forbidden error leaves the session and caches intact.
  useEffect(() => {
    if (!isAuthActionError(query.error)) return;
    handleSessionExpiry(queryClient, query.error);
  }, [query.error, queryClient]);

  return query;
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
 * application yet. The patient ID comes from the cached profile — not the
 * current enrollment — because terminal applications (Approved, Rejected,
 * Cancelled) may no longer have a current enrollment to read it from.
 *
 * Disabled until the patient ID is known (`== null` loose guard: react-query
 * types `.data` as `T | null | undefined` and `=== null` does not narrow).
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
 * Mutation wrapping `uploadDocumentAction`.
 *
 * The upload slots own the per-file UI state (progress, inline errors), so
 * this hook only toasts for errors the slot cannot render itself: session,
 * permission, and unexpected failures. Validation and storage errors map into
 * the slot's inline error text instead.
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();
  const t = useTranslations("insurance");

  return useMutation<
    CitizenDocumentResponseDto,
    AuthActionError,
    UploadDocumentInput
  >({
    mutationFn: async (input) => {
      const res = await uploadDocumentAction(input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("documents.uploaded"));
      // A re-upload supersedes the previous file, so the whole documents list
      // refreshes; the readiness gate also re-checks documentsComplete, and the
      // review snapshot must re-read so its counts/lists are not stale.
      queryClient.invalidateQueries({ queryKey: ["insurance", "documents"] });
      queryClient.invalidateQueries({ queryKey: READINESS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SUMMARY_QUERY_KEY });
    },
    onError: (error) => {
      if (
        error.kind === "validation" ||
        error.kind === "server" ||
        Object.keys(error.fieldErrors ?? {}).length > 0
      ) {
        return;
      }
      if (isForbidden(error)) {
        toast.error(t("errors.forbidden"));
        return;
      }
      if (handleSessionExpiry(queryClient, error)) {
        toast.error(t("errors.sessionExpired"));
        return;
      }
      toast.error(t("errors.generic"));
    },
  });
}

/** Mutation wrapping `addDependentAction`. */
export function useAddDependent() {
  const queryClient = useQueryClient();
  const t = useTranslations("insurance");

  return useMutation<
    DependentResponseDto,
    AuthActionError,
    AddDependentRequestDto
  >({
    mutationFn: async (input) => {
      const res = await addDependentAction(input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("dependents.added"));
      queryClient.invalidateQueries({ queryKey: ["insurance", "dependents"] });
      queryClient.invalidateQueries({ queryKey: READINESS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SUMMARY_QUERY_KEY });
    },
    onError: (error) => {
      if (
        error.kind === "validation" ||
        Object.keys(error.fieldErrors ?? {}).length > 0
      ) {
        return;
      }
      if (isForbidden(error)) {
        toast.error(t("errors.forbidden"));
        return;
      }
      if (handleSessionExpiry(queryClient, error)) {
        toast.error(t("errors.sessionExpired"));
        return;
      }
      if (error.kind === "conflict") {
        toast.error(t("dependents.errors.alreadyExists"));
        return;
      }
      if (error.kind === "notFound") {
        toast.error(t("errors.notFound"));
        return;
      }
      toast.error(t("errors.generic"));
    },
  });
}

/** Mutation wrapping `endDependentAction` (removes a dependent). */
export function useEndDependent() {
  const queryClient = useQueryClient();
  const t = useTranslations("insurance");

  return useMutation<DependentResponseDto, AuthActionError, string>({
    mutationFn: async (relationshipId) => {
      const res = await endDependentAction(relationshipId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("dependents.ended"));
      queryClient.invalidateQueries({ queryKey: ["insurance", "dependents"] });
      queryClient.invalidateQueries({ queryKey: READINESS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SUMMARY_QUERY_KEY });
    },
    onError: (error) => {
      if (
        error.kind === "validation" ||
        Object.keys(error.fieldErrors ?? {}).length > 0
      ) {
        return;
      }
      if (isForbidden(error)) {
        toast.error(t("errors.forbidden"));
        return;
      }
      if (handleSessionExpiry(queryClient, error)) {
        toast.error(t("errors.sessionExpired"));
        return;
      }
      if (error.kind === "conflict") {
        toast.error(t("dependents.errors.alreadyEnded"));
        return;
      }
      if (error.kind === "notFound") {
        toast.error(t("dependents.errors.notFound"));
        return;
      }
      toast.error(t("errors.generic"));
    },
  });
}

/**
 * Mutation wrapping `submitEnrollmentAction`. On success the whole insurance
 * cache refreshes and the patient moves to the tracking page.
 */
export function useSubmitEnrollment() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const t = useTranslations("insurance");

  return useMutation<ApplicationResponseDto, AuthActionError, void>({
    mutationFn: async () => {
      const res = await submitEnrollmentAction();
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance"] });
      router.push("/dashboard/insurance/track");
    },
    onError: (error) => {
      // A validation failure is rendered inline by the review step (it
      // invalidates readiness to re-read the missing requirements).
      if (
        error.kind === "validation" ||
        Object.keys(error.fieldErrors ?? {}).length > 0
      ) {
        return;
      }
      if (isForbidden(error)) {
        toast.error(t("errors.forbidden"));
        return;
      }
      if (handleSessionExpiry(queryClient, error)) {
        toast.error(t("errors.sessionExpired"));
        return;
      }
      if (error.kind === "conflict") {
        toast.error(t("enrollment.errors.alreadyExists"));
        router.push("/dashboard/insurance/track");
        return;
      }
      toast.error(t("errors.generic"));
    },
  });
}

/** Mutation wrapping `cancelApplicationAction`. */
export function useCancelApplication() {
  const queryClient = useQueryClient();
  const t = useTranslations("insurance");

  return useMutation<ApplicationResponseDto, AuthActionError, string>({
    mutationFn: async (applicationId) => {
      const res = await cancelApplicationAction(applicationId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("applications.cancelled"));
      queryClient.invalidateQueries({ queryKey: ["insurance"] });
    },
    onError: (error) => {
      if (
        error.kind === "validation" ||
        Object.keys(error.fieldErrors ?? {}).length > 0
      ) {
        return;
      }
      if (isForbidden(error)) {
        toast.error(t("errors.forbidden"));
        return;
      }
      if (handleSessionExpiry(queryClient, error)) {
        toast.error(t("errors.sessionExpired"));
        return;
      }
      if (error.kind === "conflict") {
        toast.error(t("applications.errors.terminal"));
        return;
      }
      toast.error(t("errors.generic"));
    },
  });
}
