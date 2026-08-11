"use client";

import { useQuery } from "@tanstack/react-query";
import { meAction } from "../actions";

/** Cache key for the current-user identity query. */
export const ME_QUERY_KEY = ["auth", "me"] as const;

/**
 * Source of truth for the authenticated user's identity.
 *
 * Wraps the `meAction` Server Action. Returns `null` when no session exists
 * (cookie missing or expired) — that is *not* an error, so callers can branch
 * on `data === undefined` (still loading) vs `data === null` (logged out).
 *
 * Real failures (network down, 5xx) surface as `isError` so the UI can retry.
 */
export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      const res = await meAction();
      if (!res.ok) throw res.error;
      return res.data;
    },
    // Never cache a stale identity across reloads longer than the JWT lifetime.
    staleTime: 60_000,
  });
}
