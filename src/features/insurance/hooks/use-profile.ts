"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { getProfileAction, updateProfileAction } from "../actions";
import { READINESS_QUERY_KEY } from "../enrollment/hooks/use-enrollment";
import type { ProfileResponseDto, UpdateProfileRequestDto } from "../types";
import {
  handleSessionExpiry,
  isAuthActionError,
  isForbidden,
  isTerminalActionError,
} from "./session-guard";

/** Cache key for the authenticated patient's insurance profile. */
export const PROFILE_QUERY_KEY = ["insurance", "profile"] as const;

/**
 * Source of truth for the patient's insurance profile.
 *
 * Wraps `getProfileAction` and normalizes its `ActionResult` so react-query's
 * error state holds the structured `AuthActionError` (consumers branch on
 * `error.kind` instead of unwrapping an `ok` flag).
 */
export function useProfile() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const res = await getProfileAction();
      if (!res.ok) throw res.error;
      return res.data;
    },
    staleTime: 60_000,
    // Deterministic action errors won't heal; retrying a dead session would
    // re-clear the cookie and delay the AuthGuard redirect, and retrying a
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

/** Mutation wrapping `updateProfileAction` with success toast + cache refresh. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const t = useTranslations("insurance");

  return useMutation<
    ProfileResponseDto,
    AuthActionError,
    UpdateProfileRequestDto
  >({
    mutationFn: async (input) => {
      const res = await updateProfileAction(input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("profile.saved"));
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      // Profile completion gates the enrollment wizard, so the readiness
      // snapshot must refresh after every save.
      queryClient.invalidateQueries({ queryKey: READINESS_QUERY_KEY });
    },
    onError: (error) => {
      // Field errors are already mapped into the form via `setError`; a
      // generic toast would double-surface them.
      if (
        error.kind === "validation" ||
        Object.keys(error.fieldErrors ?? {}).length > 0
      ) {
        return;
      }
      // 403: authenticated but lacking permission — keep the session and all
      // caches intact, just surface the localized forbidden message.
      if (isForbidden(error)) {
        toast.error(t("errors.forbidden"));
        return;
      }
      // The session cookie is already cleared server-side; drop the cached
      // identity and insurance data too so the next authenticated render
      // redirects to login instead of showing a ghost session.
      if (handleSessionExpiry(queryClient, error)) {
        toast.error(t("errors.sessionExpired"));
        return;
      }
      if (error.kind === "notFound") {
        toast.error(t("errors.notFound"));
        return;
      }
      toast.error(t("errors.generic"));
    },
  });
}
