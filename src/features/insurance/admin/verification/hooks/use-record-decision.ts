"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { parsePatientId } from "@/features/insurance/lib/parse-patient-id";
import { useVerificationMutationError } from "./use-verification-mutation-error";

/**
 * Shared form core for verification + eligibility cards: reason + remarks,
 * submit lifecycle (success toast, clear reason/remarks), and canSubmit.
 * Patient id is owned by the page (shared + URL-synced).
 */
export function useRecordDecision<TResult, TVars>(
  submit: (variables: TVars) => Promise<TResult>,
  patientId: string,
) {
  const t = useTranslations("admin");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const onError = useVerificationMutationError();

  const mutation = useMutation<TResult, AuthActionError, TVars>({
    mutationFn: submit,
    onSuccess: () => {
      toast.success(t("verification.recorded"));
      setReason("");
      setRemarks("");
    },
    onError,
  });

  const canSubmit =
    !mutation.isPending &&
    reason.trim() !== "" &&
    parsePatientId(patientId) !== null;

  return {
    reason,
    setReason,
    remarks,
    setRemarks,
    isPending: mutation.isPending,
    canSubmit,
    record: (variables: TVars) => mutation.mutate(variables),
  };
}
