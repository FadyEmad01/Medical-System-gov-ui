"use client";

import {
  type QueryClient,
  type QueryKey,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import type { ActionResult } from "@/features/auth/lib/action-error";
import {
  handleSessionExpiry,
  isAuthActionError,
  isTerminalActionError,
} from "./session-guard";

type UseActionQueryOptions = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
};

/**
 * Shared ActionResult → TanStack Query adapter: throw structured errors,
 * skip terminal auth retries, purge caches on 401.
 */
export function useActionQuery<T>(
  queryKey: QueryKey,
  action: () => Promise<ActionResult<T>>,
  options: UseActionQueryOptions = {},
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await action();
      if (!res.ok) throw res.error;
      return res.data;
    },
    staleTime: options.staleTime ?? 60_000,
    ...(options.gcTime === undefined ? {} : { gcTime: options.gcTime }),
    retry: (failureCount, error) =>
      !(isAuthActionError(error) && isTerminalActionError(error)) &&
      failureCount < 1,
    ...(options.enabled === undefined ? {} : { enabled: options.enabled }),
  });

  useEffect(() => {
    if (!isAuthActionError(query.error)) return;
    handleSessionExpiry(queryClient, query.error);
  }, [query.error, queryClient]);

  return query;
}

/** Retry predicate for queries that already unwrap ActionResult themselves. */
export function actionQueryRetry(failureCount: number, error: unknown): boolean {
  return (
    !(isAuthActionError(error) && isTerminalActionError(error)) &&
    failureCount < 1
  );
}

/** Watch a query error and purge on session expiry (RQ v5 has no onError). */
export function useSessionExpiryGuard(
  queryClient: QueryClient,
  error: unknown,
): void {
  useEffect(() => {
    if (!isAuthActionError(error)) return;
    handleSessionExpiry(queryClient, error);
  }, [error, queryClient]);
}
