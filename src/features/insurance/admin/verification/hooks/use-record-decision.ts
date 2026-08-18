"use client";

import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { useVerificationMutationError } from "./use-verification-mutation-error";

/**
 * Shared stateful form core for the two record-decision cards (verification
 * and eligibility): patient id + reason + remarks, the submit lifecycle
 * (success toast, reason/remarks clear), and validity.
 *
 * The decision-specific values (status enum, optional context) stay in the
 * card and are passed to `record()` at click time — the mutation never
 * captures stale state.
 */
export function useRecordDecision<TResult, TVars>(
  submit: (variables: TVars) => Promise<TResult>,
) {
  const t = useTranslations("admin");
  const searchParams = useSearchParams();
  const [patientId, setPatientId] = useState(
    searchParams.get("patientId") ?? "",
  );
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
    !mutation.isPending && reason.trim() !== "" && patientId.trim() !== "";

  return {
    patientId,
    setPatientId,
    reason,
    setReason,
    remarks,
    setRemarks,
    isPending: mutation.isPending,
    canSubmit,
    record: (variables: TVars) => mutation.mutate(variables),
  };
}
