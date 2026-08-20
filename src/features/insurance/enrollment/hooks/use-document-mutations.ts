"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import {
  handleSessionExpiry,
  isForbidden,
} from "../../hooks/session-guard";
import { uploadDocumentAction } from "../actions";
import type {
  CitizenDocumentResponseDto,
  UploadDocumentInput,
} from "../types";
import { READINESS_QUERY_KEY, SUMMARY_QUERY_KEY } from "./query-keys";

/**
 * Mutation wrapping `uploadDocumentAction`.
 * Validation/storage errors stay inline in the upload slot.
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
