"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import { loginAction, logoutAction, registerAction } from "../actions";
import type { AuthActionError } from "../lib/action-error";
import { toMeResponse } from "../lib/to-me-response";
import type { LoginRequest, RegisterRequest } from "../types";
import { ME_QUERY_KEY } from "./use-me";

/**
 * Login mutation. On success the `['auth','me']` query refetches so the rest
 * of the UI sees the new identity; the caller is responsible for navigation.
 *
 * On failure the structured `AuthActionError` is thrown so form code can map
 * `fieldErrors` onto React Hook Form fields via `setError`.
 */
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginRequest) => {
      const res = await loginAction(input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: (auth) => {
      // Optimistically seed the cache with the response we already have,
      // so the dashboard renders immediately without waiting for /me.
      qc.setQueryData(ME_QUERY_KEY, toMeResponse(auth));
    },
  });
}

/** Registration mutation. Same pattern as `useLogin`. */
export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegisterRequest) => {
      const res = await registerAction(input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: (auth) => {
      qc.setQueryData(ME_QUERY_KEY, toMeResponse(auth));
    },
  });
}

/**
 * Logout mutation. Clears the cache rather than refetching `/me` — without a
 * cookie the request would 401 and force a redirect anyway.
 *
 * Returns a `mutate` that callers can await before navigating to `/auth/login`.
 */
export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async () => {
      const res = await logoutAction();
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: ME_QUERY_KEY });
      // Insurance data is patient PII; never let it survive a session switch.
      qc.removeQueries({ queryKey: ["insurance"] });
      router.replace("/auth/login");
    },
  });
}

export type { AuthActionError };
