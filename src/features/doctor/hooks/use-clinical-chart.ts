"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/features/auth/hooks/use-me";
import {
  useActionQuery,
  useSessionExpiryGuard,
} from "@/features/insurance/hooks/use-action-query";
import { getMedicalSummaryAction, getVisitHistoryAction } from "../actions";
import { CLINICAL_API_AVAILABLE } from "../lib/clinical-availability";
import type { MedicalSummaryDto, VisitSummaryDto } from "../types";
import {
  DOCTOR_MEDICAL_SUMMARY_KEY,
  DOCTOR_VISIT_HISTORY_KEY,
} from "./clinical-query-keys";

function useClinicalEnabled(patientId: number): boolean {
  const meQuery = useMe();
  return (
    meQuery.data?.role === "Doctor" && CLINICAL_API_AVAILABLE && patientId >= 1
  );
}

/** GET /patients/{patientId}/medical-summary — null when none / inaccessible. */
export function useMedicalSummary(patientId: number) {
  const enabled = useClinicalEnabled(patientId);
  const queryClient = useQueryClient();
  const query = useActionQuery<MedicalSummaryDto | null>(
    DOCTOR_MEDICAL_SUMMARY_KEY(patientId),
    () => getMedicalSummaryAction(patientId),
    { enabled, staleTime: 30_000 },
  );
  useSessionExpiryGuard(queryClient, query.error);
  return query;
}

/** GET /patients/{patientId}/visit-history — chronological rows. */
export function useVisitHistory(patientId: number) {
  const enabled = useClinicalEnabled(patientId);
  const queryClient = useQueryClient();
  const query = useActionQuery<VisitSummaryDto[]>(
    DOCTOR_VISIT_HISTORY_KEY(patientId),
    () => getVisitHistoryAction(patientId),
    { enabled, staleTime: 30_000 },
  );
  useSessionExpiryGuard(queryClient, query.error);
  return query;
}
