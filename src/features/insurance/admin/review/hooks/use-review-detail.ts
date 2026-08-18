"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useMe } from "@/features/auth/hooks/use-me";
import {
  handleSessionExpiry,
  isAuthActionError,
  isTerminalActionError,
} from "../../../hooks/session-guard";
import { getReviewDetailAction } from "../actions";

/** Cache key for one application's review bundle. */
export const REVIEW_DETAIL_QUERY_KEY = (applicationId: string) =>
  ["admin", "review", applicationId] as const;

/**
 * The review-screen decision bundle.
 *
 * staleTime Infinity: the GET AUTO-CLAIMS a Submitted application, so it must
 * run exactly once per visit — no focus refetches, no retries that could
 * re-trigger. Refresh is explicit (post-decision invalidation or button).
 *
 * Role-gated like the queue (S3).
 */
export function useReviewDetail(applicationId: string) {
  const queryClient = useQueryClient();
  const meQuery = useMe();
  const enabled = meQuery.data?.role === "Admin" && applicationId.trim() !== "";

  const query = useQuery({
    queryKey: REVIEW_DETAIL_QUERY_KEY(applicationId),
    queryFn: async () => {
      const res = await getReviewDetailAction(applicationId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isAuthActionError(query.error)) return;
    handleSessionExpiry(queryClient, query.error);
  }, [query.error, queryClient]);

  return query;
}
