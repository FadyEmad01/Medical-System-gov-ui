"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getCardStateAction } from "../actions";
import {
  handleSessionExpiry,
  isAuthActionError,
  isTerminalActionError,
} from "./session-guard";

/** Cache key for the insurance card stepper state. */
export const CARD_STATE_QUERY_KEY = ["insurance", "card-state"] as const;

/**
 * Application status + current card for the insurance card dashboard.
 *
 * Same normalize-to-throw pattern as `useProfile`; components derive the
 * stepper step from the result via `deriveCardState`.
 */
export function useCardState() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: CARD_STATE_QUERY_KEY,
    queryFn: async () => {
      const res = await getCardStateAction();
      if (!res.ok) throw res.error;
      return res.data;
    },
    staleTime: 60_000,
    // Parity with `useProfile`: deterministic action errors won't heal —
    // retrying a dead session would re-clear the cookie each attempt, and a
    // forbidden request just repeats the same failed permission check.
    retry: (failureCount, error) =>
      !(isAuthActionError(error) && isTerminalActionError(error)) &&
      failureCount < 1,
  });

  // v5 dropped query-level `onError`; watch the error state so a dead session
  // drops the identity cache and lets AuthGuard redirect immediately. Load
  // errors surface in the page's persistent inline Alert — no toast here —
  // and a forbidden error leaves the session and caches intact.
  useEffect(() => {
    if (!isAuthActionError(query.error)) return;
    handleSessionExpiry(queryClient, query.error);
  }, [query.error, queryClient]);

  return query;
}
