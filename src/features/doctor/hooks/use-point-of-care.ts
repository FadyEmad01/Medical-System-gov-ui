"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useMe } from "@/features/auth/hooks/use-me";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { useActionMutationError } from "@/features/insurance/hooks/use-action-mutation-error";
import {
  actionQueryRetry,
  useSessionExpiryGuard,
} from "@/features/insurance/hooks/use-action-query";
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
  InsuranceEligibilityResponseDto,
  InsuranceVerificationResponseDto,
  VerifyInsuranceInput,
} from "@/features/insurance/verification/types";

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

/** Parallel snapshot reads when a valid patientId is loaded. */
export function useCoverageSnapshot(patientId: number | null) {
  const enabled = useDoctorEnabled(patientId);
  const id = patientId ?? 0;
  const queryClient = useQueryClient();

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
    retry: actionQueryRetry,
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
    retry: actionQueryRetry,
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
    retry: actionQueryRetry,
  });

  useSessionExpiryGuard(
    queryClient,
    eligibility.error ?? current.error ?? latest.error,
  );

  return { eligibility, current, latest, enabled };
}

export function useVerificationHistory(patientId: number | null) {
  const enabled = useDoctorEnabled(patientId);
  const id = patientId ?? 0;
  const queryClient = useQueryClient();

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
    retry: actionQueryRetry,
  });

  useSessionExpiryGuard(queryClient, query.error);
  return query;
}

function useDoctorMutationError() {
  const t = useTranslations("doctor");
  return useActionMutationError({
    onSessionExpired: () => toast.error(t("errors.sessionExpired")),
    onForbidden: () => toast.error(t("errors.forbidden")),
    onValidation: () => toast.error(t("errors.reason")),
    onNotFound: () => toast.error(t("errors.notFound")),
    onGeneric: () => toast.error(t("errors.generic")),
  });
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
