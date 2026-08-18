"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import type { ApplicationResponseDto } from "../../../enrollment/types";
import { handleSessionExpiry, isForbidden } from "../../../hooks/session-guard";
import {
  approveApplicationAction,
  backToReviewAction,
  rejectApplicationAction,
  requestDocumentsAction,
} from "../actions";
import type { DecisionInput } from "../types";
import { REVIEW_DETAIL_QUERY_KEY } from "./use-review-detail";

/**
 * Shared decision-mutation behavior: the dialog supplies the reason payload
 * as mutation variables; on success the queue, this review bundle, and the
 * citizen-side insurance cache all invalidate (the citizen tracking page
 * must reflect the new state). Errors map like the citizen mutations —
 * inline validation, forbidden toast, session expiry redirect, and a
 * dedicated 409 path (another admin decided first → refetch + re-derive).
 */
function useDecisionMutation(
  applicationId: string,
  mutationFn: (input: DecisionInput) => Promise<ApplicationResponseDto>,
  successKey: string,
) {
  const queryClient = useQueryClient();
  const t = useTranslations("admin");

  return useMutation<ApplicationResponseDto, AuthActionError, DecisionInput>({
    mutationFn,
    onSuccess: () => {
      toast.success(t(successKey));
      queryClient.invalidateQueries({ queryKey: ["admin", "applications"] });
      queryClient.invalidateQueries({
        queryKey: REVIEW_DETAIL_QUERY_KEY(applicationId),
      });
      // The citizen tracking surface reads the same application.
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
        toast.error(t("actions.errors.forbidden"));
        return;
      }
      if (handleSessionExpiry(queryClient, error)) {
        toast.error(t("actions.errors.sessionExpired"));
        return;
      }
      if (error.kind === "conflict") {
        toast.error(t("actions.errors.conflict"));
        void queryClient.refetchQueries({
          queryKey: REVIEW_DETAIL_QUERY_KEY(applicationId),
        });
        return;
      }
      toast.error(t("actions.errors.generic"));
    },
  });
}

export function useApproveApplication(applicationId: string) {
  return useDecisionMutation(
    applicationId,
    async (input) => {
      const res = await approveApplicationAction(applicationId, input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "actions.approved",
  );
}

export function useRejectApplication(applicationId: string) {
  return useDecisionMutation(
    applicationId,
    async (input) => {
      const res = await rejectApplicationAction(applicationId, input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "actions.rejected",
  );
}

export function useRequestDocuments(applicationId: string) {
  return useDecisionMutation(
    applicationId,
    async (input) => {
      const res = await requestDocumentsAction(applicationId, input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "actions.requestedDocuments",
  );
}

export function useBackToReview(applicationId: string) {
  return useDecisionMutation(
    applicationId,
    async () => {
      const res = await backToReviewAction(applicationId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "actions.backToReview",
  );
}
