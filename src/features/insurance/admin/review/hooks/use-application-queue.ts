"use client";

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { useMe } from "@/features/auth/hooks/use-me";
import type { ActionResult } from "@/features/auth/lib/action-error";
import {
  handleSessionExpiry,
  isAuthActionError,
  isTerminalActionError,
} from "../../../hooks/session-guard";
import { getApplicationQueueAction } from "../actions";
import type { QueueQuery } from "../api/applications-queue-client";

/** Cache key for the paged, filtered application queue. */
export const QUEUE_QUERY_KEY = (query: QueueQuery) =>
  ["admin", "applications", query.status ?? "all", query.page ?? 1] as const;

/**
 * The cross-patient application queue.
 *
 * Role-gated (S3): fires only once `useMe` confirms the Admin role, so a
 * patient token on this route costs zero admin round-trips. Focus refetching
 * is ON for the queue — cheap, paged, side-effect-free — to keep multi-admin
 * queues honest between manual refreshes.
 */
export function useApplicationQueue(query: QueueQuery) {
  const queryClient = useQueryClient();
  const meQuery = useMe();
  const enabled = meQuery.data?.role === "Admin";

  const queueQuery = useQuery({
    queryKey: QUEUE_QUERY_KEY(query),
    queryFn: async () => {
      const res = await getApplicationQueueAction(query);
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    // Admin bundles carry PII; age them out of memory even without expiry (S1).
    gcTime: 5 * 60_000,
    retry: (failureCount, error) =>
      !(isAuthActionError(error) && isTerminalActionError(error)) &&
      failureCount < 1,
  });

  useEffect(() => {
    if (!isAuthActionError(queueQuery.error)) return;
    handleSessionExpiry(queryClient, queueQuery.error);
  }, [queueQuery.error, queryClient]);

  return { queueQuery, enabled };
}
