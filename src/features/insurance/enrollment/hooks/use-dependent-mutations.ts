"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import {
  handleSessionExpiry,
  isForbidden,
} from "../../hooks/session-guard";
import { addDependentAction, endDependentAction } from "../actions";
import type {
  AddDependentRequestDto,
  DependentResponseDto,
} from "../types";
import { READINESS_QUERY_KEY, SUMMARY_QUERY_KEY } from "./query-keys";

/** Mutation wrapping `addDependentAction`. */
export function useAddDependent() {
  const queryClient = useQueryClient();
  const t = useTranslations("insurance");

  return useMutation<
    DependentResponseDto,
    AuthActionError,
    AddDependentRequestDto
  >({
    mutationFn: async (input) => {
      const res = await addDependentAction(input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("dependents.added"));
      queryClient.invalidateQueries({ queryKey: ["insurance", "dependents"] });
      queryClient.invalidateQueries({ queryKey: READINESS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SUMMARY_QUERY_KEY });
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
        toast.error(t("dependents.errors.alreadyExists"));
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

/** Mutation wrapping `endDependentAction` (removes a dependent). */
export function useEndDependent() {
  const queryClient = useQueryClient();
  const t = useTranslations("insurance");

  return useMutation<DependentResponseDto, AuthActionError, string>({
    mutationFn: async (relationshipId) => {
      const res = await endDependentAction(relationshipId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("dependents.ended"));
      queryClient.invalidateQueries({ queryKey: ["insurance", "dependents"] });
      queryClient.invalidateQueries({ queryKey: READINESS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SUMMARY_QUERY_KEY });
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
        toast.error(t("dependents.errors.alreadyEnded"));
        return;
      }
      if (error.kind === "notFound") {
        toast.error(t("dependents.errors.notFound"));
        return;
      }
      toast.error(t("errors.generic"));
    },
  });
}
