"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { useActionMutationError } from "../../../hooks/use-action-mutation-error";
import type { CardResponseDto } from "../../../types";
import {
  issueCardsAction,
  reactivateCardAction,
  renewCardAction,
  replaceCardAction,
  revokeCardAction,
  rotateCardTokenAction,
  suspendCardAction,
} from "../actions";
import type { ReplacementReason } from "../types";
import {
  CARD_HISTORY_QUERY_KEY,
  CURRENT_CARD_QUERY_KEY,
  PATIENT_STATUS_QUERY_KEY,
} from "./query-keys";

/**
 * Shared mutation wiring: success invalidates the patient's card history and
 * any open detail (renew/replace create successors — the whole list refetches
 * so supersession is immediately visible), plus the citizen card cache.
 */
function useCardMutation<TVariables = void>(
  patientId: number,
  mutationFn: (variables: TVariables) => Promise<CardResponseDto>,
  successKey: string,
) {
  const queryClient = useQueryClient();
  const t = useTranslations("admin");
  const onError = useActionMutationError({
    onSessionExpired: () => toast.error(t("actions.errors.sessionExpired")),
    onForbidden: () => toast.error(t("actions.errors.forbidden")),
    onValidation: () => toast.error(t("cards.errors.reasonInvalid")),
    onConflict: () => {
      toast.error(t("cards.errors.conflict"));
      void queryClient.invalidateQueries({
        queryKey: CARD_HISTORY_QUERY_KEY(patientId),
      });
    },
    onGeneric: () => toast.error(t("actions.errors.generic")),
  });

  return useMutation<CardResponseDto, AuthActionError, TVariables>({
    mutationFn,
    onSuccess: () => {
      toast.success(t(successKey));
      queryClient.invalidateQueries({
        queryKey: CARD_HISTORY_QUERY_KEY(patientId),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "cards", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["insurance", "card-state"] });
    },
    onError: (error) => {
      if (
        error.kind === "validation" ||
        Object.keys(error.fieldErrors ?? {}).length > 0
      ) {
        toast.error(t("cards.errors.reasonInvalid"));
        return;
      }
      onError(error);
    },
  });
}

export function useSuspendCard(patientId: number, cardId: string) {
  return useCardMutation(
    patientId,
    async (reason: string) => {
      const res = await suspendCardAction(cardId, reason);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "cards.toasts.suspended",
  );
}

export function useRevokeCard(patientId: number, cardId: string) {
  return useCardMutation(
    patientId,
    async (reason: string) => {
      const res = await revokeCardAction(cardId, reason);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "cards.toasts.revoked",
  );
}

export function useRenewCard(patientId: number, cardId: string) {
  return useCardMutation(
    patientId,
    async (reason: string) => {
      const res = await renewCardAction(cardId, reason);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "cards.toasts.renewed",
  );
}

export function useReactivateCard(patientId: number, cardId: string) {
  return useCardMutation(
    patientId,
    async () => {
      const res = await reactivateCardAction(cardId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "cards.toasts.reactivated",
  );
}

export function useRotateCardToken(patientId: number, cardId: string) {
  return useCardMutation(
    patientId,
    async () => {
      const res = await rotateCardTokenAction(cardId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "cards.toasts.tokenRotated",
  );
}

export function useReplaceCard(patientId: number, cardId: string) {
  return useCardMutation(
    patientId,
    async (input: {
      replacementReason: ReplacementReason;
      reasonNote: string;
    }) => {
      const res = await replaceCardAction(cardId, input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "cards.toasts.replaced",
  );
}

export function useIssueCards(applicationId: string, patientId?: number) {
  const queryClient = useQueryClient();
  const t = useTranslations("admin");
  const onError = useActionMutationError({
    onSessionExpired: () => toast.error(t("actions.errors.sessionExpired")),
    onForbidden: () => toast.error(t("actions.errors.forbidden")),
    onConflict: () => toast.error(t("cards.errors.alreadyIssued")),
    onGeneric: () => toast.error(t("actions.errors.generic")),
  });

  return useMutation({
    mutationFn: async () => {
      const res = await issueCardsAction(applicationId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: (cards) => {
      toast.success(t("cards.toasts.issued", { count: cards.length }));
      if (patientId != null) {
        queryClient.invalidateQueries({
          queryKey: CARD_HISTORY_QUERY_KEY(patientId),
        });
        queryClient.invalidateQueries({
          queryKey: CURRENT_CARD_QUERY_KEY(patientId),
        });
        queryClient.invalidateQueries({
          queryKey: PATIENT_STATUS_QUERY_KEY(patientId),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["insurance"] });
    },
    onError,
  });
}
