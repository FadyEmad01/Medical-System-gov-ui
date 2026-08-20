"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/features/auth/hooks/use-me";
import {
  actionQueryRetry,
  useSessionExpiryGuard,
} from "../../../hooks/use-action-query";
import {
  getCardDetailAction,
  getCardHistoryAction,
  getCurrentCardAction,
  getPatientApplicationDetailAction,
  getPatientApplicationsAction,
  getPatientStatusAction,
} from "../actions";
import {
  CARD_DETAIL_QUERY_KEY,
  CARD_HISTORY_QUERY_KEY,
  CURRENT_CARD_QUERY_KEY,
  PATIENT_APPLICATION_DETAIL_QUERY_KEY,
  PATIENT_APPLICATIONS_QUERY_KEY,
  PATIENT_STATUS_QUERY_KEY,
} from "./query-keys";

/**
 * Role-gated reads (S3). The history is the page's primary query; the detail
 * (with the audit trail) is fetched lazily per card on expand.
 */
export function useCardHistory(patientId: number) {
  const queryClient = useQueryClient();
  const meQuery = useMe();
  const enabled =
    meQuery.data?.role === "Admin" &&
    Number.isInteger(patientId) &&
    patientId >= 1;

  const query = useQuery({
    queryKey: CARD_HISTORY_QUERY_KEY(patientId),
    queryFn: async () => {
      const res = await getCardHistoryAction(patientId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: actionQueryRetry,
  });

  useSessionExpiryGuard(queryClient, query.error);
  return query;
}

export function useCardDetail(cardId: string, enabled: boolean) {
  return useQuery({
    queryKey: CARD_DETAIL_QUERY_KEY(cardId),
    queryFn: async () => {
      const res = await getCardDetailAction(cardId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled: enabled && cardId !== "",
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
}

function useAdminPatientQuery<T>(
  queryKey: readonly unknown[],
  enabled: boolean,
  queryFn: () => Promise<T>,
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: actionQueryRetry,
  });

  useSessionExpiryGuard(queryClient, query.error);
  return query;
}

export function useCurrentCard(patientId: number) {
  const meQuery = useMe();
  return useAdminPatientQuery(
    CURRENT_CARD_QUERY_KEY(patientId),
    meQuery.data?.role === "Admin" &&
      Number.isInteger(patientId) &&
      patientId >= 1,
    async () => {
      const res = await getCurrentCardAction(patientId);
      if (!res.ok) throw res.error;
      return res.data;
    },
  );
}

export function usePatientStatus(patientId: number) {
  const meQuery = useMe();
  return useAdminPatientQuery(
    PATIENT_STATUS_QUERY_KEY(patientId),
    meQuery.data?.role === "Admin" &&
      Number.isInteger(patientId) &&
      patientId >= 1,
    async () => {
      const res = await getPatientStatusAction(patientId);
      if (!res.ok) throw res.error;
      return res.data;
    },
  );
}

export function usePatientApplications(patientId: number) {
  const meQuery = useMe();
  return useAdminPatientQuery(
    PATIENT_APPLICATIONS_QUERY_KEY(patientId),
    meQuery.data?.role === "Admin" &&
      Number.isInteger(patientId) &&
      patientId >= 1,
    async () => {
      const res = await getPatientApplicationsAction(patientId);
      if (!res.ok) throw res.error;
      return res.data;
    },
  );
}

export function usePatientApplicationDetail(
  applicationId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: PATIENT_APPLICATION_DETAIL_QUERY_KEY(applicationId),
    queryFn: async () => {
      const res = await getPatientApplicationDetailAction(applicationId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled: enabled && applicationId !== "",
    staleTime: 60_000,
    retry: false,
  });
}
