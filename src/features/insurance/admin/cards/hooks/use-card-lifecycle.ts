"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { useMe } from "@/features/auth/hooks/use-me";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import {
  handleSessionExpiry,
  isAuthActionError,
  isForbidden,
  isTerminalActionError,
} from "../../../hooks/session-guard";
import type { CardResponseDto } from "../../../types";
import {
  getCardDetailAction,
  getCardHistoryAction,
  reactivateCardAction,
  renewCardAction,
  replaceCardAction,
  revokeCardAction,
  rotateCardTokenAction,
  suspendCardAction,
} from "../actions";
import type { CardDetailResponseDto, ReplacementReason } from "../types";

/** Cache keys — purged with ["admin"] on session expiry (S1). */
export const CARD_HISTORY_QUERY_KEY = (patientId: number) =>
  ["admin", "cards", patientId] as const;
export const CARD_DETAIL_QUERY_KEY = (cardId: string) =>
  ["admin", "cards", "detail", cardId] as const;

/**
 * Role-gated reads (S3). The history is the page's primary query; the detail
 * (with the audit trail) is fetched lazily per card on expand.
 */
export function useCardHistory(patientId: number) {
  const queryClient = useQueryClient();
  const meQuery = useMe();
  const enabled = meQuery.data?.role === "Admin" && Number.isInteger(patientId);

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
    retry: (failureCount, error) =>
      !(isAuthActionError(error) && isTerminalActionError(error)) &&
      failureCount < 1,
  });

  useEffect(() => {
    if (!isAuthActionError(query.error)) return;
    handleSessionExpiry(queryClient, query.error);
  }, [query.error, queryClient]);

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

/**
 * Shared mutation wiring: success invalidates the patient's card history and
 * any open detail (renew/replace create successors — the whole list refetches
 * so supersession is immediately visible), plus the citizen card cache.
 */
function useCardMutation(
  patientId: number,
  mutationFn: () => Promise<CardResponseDto>,
  successKey: string,
) {
  const queryClient = useQueryClient();
  const t = useTranslations("admin");

  return useMutation<CardResponseDto, AuthActionError, void>({
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
      if (isForbidden(error)) {
        toast.error(t("actions.errors.forbidden"));
        return;
      }
      if (handleSessionExpiry(queryClient, error)) {
        toast.error(t("actions.errors.sessionExpired"));
        return;
      }
      if (error.kind === "conflict") {
        // e.g. renewing a suspended card, acting on a superseded one.
        toast.error(t("cards.errors.conflict"));
        void queryClient.invalidateQueries({
          queryKey: CARD_HISTORY_QUERY_KEY(patientId),
        });
        return;
      }
      toast.error(t("actions.errors.generic"));
    },
  });
}

export function useSuspendCard(
  patientId: number,
  cardId: string,
  reason: string,
) {
  return useCardMutation(
    patientId,
    async () => {
      const res = await suspendCardAction(cardId, reason);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "cards.toasts.suspended",
  );
}

export function useRevokeCard(
  patientId: number,
  cardId: string,
  reason: string,
) {
  return useCardMutation(
    patientId,
    async () => {
      const res = await revokeCardAction(cardId, reason);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "cards.toasts.revoked",
  );
}

export function useRenewCard(
  patientId: number,
  cardId: string,
  reason: string,
) {
  return useCardMutation(
    patientId,
    async () => {
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

export function useReplaceCard(
  patientId: number,
  cardId: string,
  input: { replacementReason: ReplacementReason; reasonNote: string },
) {
  return useCardMutation(
    patientId,
    async () => {
      const res = await replaceCardAction(cardId, input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "cards.toasts.replaced",
  );
}

export type { CardDetailResponseDto };
