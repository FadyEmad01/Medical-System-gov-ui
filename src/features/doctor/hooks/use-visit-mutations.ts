"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import {
  addMedicationsAction,
  createVisitAction,
  updateVisitAction,
  updateVisitStatusAction,
} from "../actions";
import type {
  AddMedicationsInput,
  CreateVisitInput,
  UpdateVisitInput,
  UpdateVisitStatusInput,
  VisitDetailDto,
} from "../types";
import {
  DOCTOR_MEDICAL_SUMMARY_KEY,
  DOCTOR_VISIT_HISTORY_KEY,
  DOCTOR_VISIT_KEY,
} from "./clinical-query-keys";
import { useClinicalMutationError } from "./use-clinical-patients";

/** Invalidate everything scoped to the visit's patient after a write. */
function useInvalidatePatientScope(patientId: number | undefined) {
  const queryClient = useQueryClient();
  return () => {
    if (patientId === undefined || patientId < 1) return;
    void queryClient.invalidateQueries({
      queryKey: DOCTOR_VISIT_HISTORY_KEY(patientId),
    });
    void queryClient.invalidateQueries({
      queryKey: DOCTOR_MEDICAL_SUMMARY_KEY(patientId),
    });
  };
}

/** Visit writes return the updated visit — swap it straight into the cache. */
function useApplyVisitResponse(visitId: string) {
  const queryClient = useQueryClient();
  const invalidateScope = useInvalidatePatientScope(undefined);
  return (visit: VisitDetailDto) => {
    queryClient.setQueryData<VisitDetailDto>(DOCTOR_VISIT_KEY(visitId), visit);
    invalidateScope();
  };
}

export function useCreateVisitMutation(patientId: number) {
  const t = useTranslations("doctor");
  const onError = useClinicalMutationError();
  const invalidate = useInvalidatePatientScope(patientId);

  return useMutation<VisitDetailDto, AuthActionError, CreateVisitInput>({
    mutationFn: async (input) => {
      const res = await createVisitAction(input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("visits.created"));
      invalidate();
    },
    onError,
  });
}

export function useUpdateVisitMutation(visitId: string, patientId?: number) {
  const t = useTranslations("doctor");
  const onError = useClinicalMutationError();
  const applyVisit = useApplyVisitResponse(visitId);
  const invalidateScope = useInvalidatePatientScope(patientId);

  return useMutation<VisitDetailDto, AuthActionError, UpdateVisitInput>({
    mutationFn: async (input) => {
      const res = await updateVisitAction(visitId, input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: (visit) => {
      toast.success(t("visits.noteSaved"));
      applyVisit(visit);
      invalidateScope();
    },
    onError,
  });
}

export function useUpdateVisitStatusMutation(
  visitId: string,
  patientId?: number,
) {
  const t = useTranslations("doctor");
  const onError = useClinicalMutationError();
  const applyVisit = useApplyVisitResponse(visitId);
  const invalidateScope = useInvalidatePatientScope(patientId);

  return useMutation<VisitDetailDto, AuthActionError, UpdateVisitStatusInput>({
    mutationFn: async (input) => {
      const res = await updateVisitStatusAction(input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: (visit) => {
      toast.success(t("visits.statusUpdated"));
      applyVisit(visit);
      invalidateScope();
    },
    onError,
  });
}

export function useAddMedicationsMutation(visitId: string, patientId?: number) {
  const t = useTranslations("doctor");
  const onError = useClinicalMutationError();
  const applyVisit = useApplyVisitResponse(visitId);
  const invalidateScope = useInvalidatePatientScope(patientId);

  return useMutation<VisitDetailDto, AuthActionError, AddMedicationsInput>({
    mutationFn: async (input) => {
      const res = await addMedicationsAction(input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: (visit) => {
      toast.success(t("medications.added"));
      applyVisit(visit);
      invalidateScope();
    },
    onError,
  });
}
