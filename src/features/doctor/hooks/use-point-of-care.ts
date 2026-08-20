"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { useMe } from "@/features/auth/hooks/use-me";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import type {
  InsuranceEligibilityResponseDto,
  InsuranceVerificationResponseDto,
} from "@/features/insurance/admin/review/types";
import {
  getCurrentVerificationAction,
  getEligibilityAction,
  getLatestVerificationAction,
  getVerificationHistoryAction,
  recordVerificationAction,
  verifyCardAction,
} from "@/features/insurance/verification/actions";
import type {
  CardVerificationResultDto,
  VerifyInsuranceInput,
} from "@/features/insurance/verification/types";
import {
  handleSessionExpiry,
  isAuthActionError,
  isForbidden,
  isTerminalActionError,
} from "@/features/insurance/hooks/session-guard";

/** Cache keys — purged with ["doctor"] on session expiry. */
export const DOCTOR_ELIGIBILITY_KEY = (patientId: number) =>
  ["doctor", "eligibility", patientId] as const;
export const DOCTOR_CURRENT_KEY = (patientId: number) =>
  ["doctor", "verification", "current", patientId] as const;
export const DOCTOR_LATEST_KEY = (patientId: number) =>
  ["doctor", "verification", "latest", patientId] as const;
export const DOCTOR_HISTORY_KEY = (patientId: number) =>
  ["doctor", "verification", "history", patientId] as const;

function useDoctorEnabled(patientId: number | null) {
  const meQuery = useMe();
  return (
    meQuery.data?.role === "Doctor" &&
    patientId !== null &&
    Number.isInteger(patientId) &&
    patientId >= 1
  );
}

function useDoctorSessionGuard(error: unknown) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isAuthActionError(error)) return;
    handleSessionExpiry(queryClient, error);
  }, [error, queryClient]);
}

function doctorRetry(failureCount: number, error: unknown) {
  return (
    !(isAuthActionError(error) && isTerminalActionError(error)) &&
    failureCount < 1
  );
}

/** Parallel snapshot reads when a valid patientId is loaded. */
export function useCoverageSnapshot(patientId: number | null) {
  const enabled = useDoctorEnabled(patientId);
  const id = patientId ?? 0;

  const eligibility = useQuery({
    queryKey: DOCTOR_ELIGIBILITY_KEY(id),
    queryFn: async (): Promise<InsuranceEligibilityResponseDto | null> => {
      const res = await getEligibilityAction(id);
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: doctorRetry,
  });

  const current = useQuery({
    queryKey: DOCTOR_CURRENT_KEY(id),
    queryFn: async (): Promise<InsuranceVerificationResponseDto | null> => {
      const res = await getCurrentVerificationAction(id);
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: doctorRetry,
  });

  const latest = useQuery({
    queryKey: DOCTOR_LATEST_KEY(id),
    queryFn: async (): Promise<InsuranceVerificationResponseDto | null> => {
      const res = await getLatestVerificationAction(id);
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: doctorRetry,
  });

  useDoctorSessionGuard(eligibility.error ?? current.error ?? latest.error);

  return { eligibility, current, latest, enabled };
}

export function useVerificationHistory(patientId: number | null) {
  const enabled = useDoctorEnabled(patientId);
  const id = patientId ?? 0;

  const query = useQuery({
    queryKey: DOCTOR_HISTORY_KEY(id),
    queryFn: async (): Promise<InsuranceVerificationResponseDto[]> => {
      const res = await getVerificationHistoryAction(id);
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: doctorRetry,
  });

  useDoctorSessionGuard(query.error);
  return query;
}

function useDoctorMutationError() {
  const t = useTranslations("doctor");
  const queryClient = useQueryClient();

  return (error: AuthActionError) => {
    if (handleSessionExpiry(queryClient, error)) {
      toast.error(t("errors.sessionExpired"));
      return;
    }
    if (error.kind === "validation") {
      toast.error(t("errors.reason"));
      return;
    }
    if (isForbidden(error)) {
      toast.error(t("errors.forbidden"));
      return;
    }
    if (error.kind === "notFound") {
      toast.error(t("errors.notFound"));
      return;
    }
    toast.error(t("errors.generic"));
  };
}

export function useVerifyCardMutation() {
  const onError = useDoctorMutationError();

  return useMutation<CardVerificationResultDto, AuthActionError, string>({
    mutationFn: async (token) => {
      const res = await verifyCardAction(token);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onError,
  });
}

export function useRecordVerificationMutation(patientId: number | null) {
  const t = useTranslations("doctor");
  const queryClient = useQueryClient();
  const onError = useDoctorMutationError();

  return useMutation<
    InsuranceVerificationResponseDto,
    AuthActionError,
    Omit<VerifyInsuranceInput, "patientId">
  >({
    mutationFn: async (input) => {
      if (patientId === null || !Number.isInteger(patientId) || patientId < 1) {
        throw {
          kind: "validation",
          formError: "verification.errors.invalidInput",
          fieldErrors: {},
        } satisfies AuthActionError;
      }
      const res = await recordVerificationAction({
        ...input,
        patientId,
      });
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("record.recorded"));
      if (patientId === null) return;
      queryClient.invalidateQueries({
        queryKey: DOCTOR_ELIGIBILITY_KEY(patientId),
      });
      queryClient.invalidateQueries({
        queryKey: DOCTOR_CURRENT_KEY(patientId),
      });
      queryClient.invalidateQueries({
        queryKey: DOCTOR_LATEST_KEY(patientId),
      });
      queryClient.invalidateQueries({
        queryKey: DOCTOR_HISTORY_KEY(patientId),
      });
    },
    onError,
  });
}
