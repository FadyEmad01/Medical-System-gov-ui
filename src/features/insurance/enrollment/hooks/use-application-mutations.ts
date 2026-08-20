"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { useRouter } from "@/i18n/navigation";
import {
  handleSessionExpiry,
  isForbidden,
} from "../../hooks/session-guard";
import {
  cancelApplicationAction,
  submitEnrollmentAction,
} from "../actions";
import type { ApplicationResponseDto } from "../types";

/**
 * Mutation wrapping `submitEnrollmentAction`. On success the whole insurance
 * cache refreshes and the patient moves to the tracking page.
 */
export function useSubmitEnrollment() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const t = useTranslations("insurance");

  return useMutation<ApplicationResponseDto, AuthActionError, void>({
    mutationFn: async () => {
      const res = await submitEnrollmentAction();
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance"] });
      router.push("/dashboard/insurance/track");
    },
    onError: (error) => {
      if (
        error.kind === "validation" ||
        Object.keys(error.fieldErrors ?? {}).length > 0
      ) {
        return;
      }
      if (isForbidden(error)) {
        toast.error(t("errors.forbidden"));
        return;
      }
      if (handleSessionExpiry(queryClient, error)) {
        toast.error(t("errors.sessionExpired"));
        return;
      }
      if (error.kind === "conflict") {
        toast.error(t("enrollment.errors.alreadyExists"));
        router.push("/dashboard/insurance/track");
        return;
      }
      toast.error(t("errors.generic"));
    },
  });
}

/** Mutation wrapping `cancelApplicationAction`. */
export function useCancelApplication() {
  const queryClient = useQueryClient();
  const t = useTranslations("insurance");

  return useMutation<ApplicationResponseDto, AuthActionError, string>({
    mutationFn: async (applicationId) => {
      const res = await cancelApplicationAction(applicationId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("applications.cancelled"));
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
        toast.error(t("errors.forbidden"));
        return;
      }
      if (handleSessionExpiry(queryClient, error)) {
        toast.error(t("errors.sessionExpired"));
        return;
      }
      if (error.kind === "conflict") {
        toast.error(t("applications.errors.terminal"));
        return;
      }
      toast.error(t("errors.generic"));
    },
  });
}
