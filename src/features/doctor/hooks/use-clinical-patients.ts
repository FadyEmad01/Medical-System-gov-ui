"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useMe } from "@/features/auth/hooks/use-me";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { useActionMutationError } from "@/features/insurance/hooks/use-action-mutation-error";
import {
  useActionQuery,
  useSessionExpiryGuard,
} from "@/features/insurance/hooks/use-action-query";
import { getMyPatientsAction, searchPatientAction } from "../actions";
import {
  CLINICAL_API_AVAILABLE,
  isPendingBackendError,
} from "../lib/clinical-availability";
import type { PatientSummaryDto, RosterEntryDto } from "../types";
import { DOCTOR_ROSTER_KEY } from "./clinical-query-keys";

function useClinicalEnabled(): boolean {
  const meQuery = useMe();
  return meQuery.data?.role === "Doctor" && CLINICAL_API_AVAILABLE;
}

/** Shared mutation error ladder — routes the pending-backend case to an info toast. */
export function useClinicalMutationError() {
  const t = useTranslations("doctor");
  const ladder = useActionMutationError({
    onSessionExpired: () => toast.error(t("errors.sessionExpired")),
    onForbidden: () => toast.error(t("errors.forbidden")),
    onValidation: (error: AuthActionError) =>
      toast.error(
        error.formError === "doctor.errors.invalidMedicationRow"
          ? t("errors.invalidMedicationRow")
          : error.formError === "doctor.errors.invalidNationalId"
            ? t("errors.invalidNationalId")
            : t("errors.invalidInput"),
      ),
    onNotFound: () => toast.error(t("errors.notFound")),
    onConflict: () => toast.error(t("errors.conflict")),
    onGeneric: () => toast.error(t("errors.generic")),
  });

  return (error: AuthActionError) => {
    if (isPendingBackendError(error)) {
      toast.info(t("errors.pendingBackend"));
      return;
    }
    ladder(error);
  };
}

export function useClinicalPendingToast() {
  const t = useTranslations("doctor");
  return () => toast.info(t("errors.pendingBackend"));
}

/** GET /doctors/{doctorId}/patients — assigned ∪ visit-derived roster. */
export function useMyPatients() {
  const enabled = useClinicalEnabled();
  const doctorId = useMe().data?.userId ?? 0;
  const queryClient = useQueryClient();

  const query = useActionQuery<RosterEntryDto[]>(
    DOCTOR_ROSTER_KEY(doctorId),
    () => getMyPatientsAction(doctorId),
    { enabled: enabled && doctorId >= 1, staleTime: 30_000 },
  );
  useSessionExpiryGuard(queryClient, query.error);
  return query;
}

/**
 * GET /patients/search?nationalId= — exact match, run on submit.
 * `notFound` is surfaced as `null` (neutral privacy message), not an error.
 */
export function usePatientSearchMutation() {
  const onError = useClinicalMutationError();

  return useMutation<PatientSummaryDto | null, AuthActionError, string>({
    mutationFn: async (nationalId) => {
      const res = await searchPatientAction(nationalId);
      if (!res.ok) {
        if (res.error.kind === "notFound") return null;
        throw res.error;
      }
      return res.data;
    },
    onError,
  });
}
