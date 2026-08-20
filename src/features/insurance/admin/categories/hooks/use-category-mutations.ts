"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { CATEGORIES_QUERY_KEY } from "../../../enrollment/hooks/use-enrollment";
import type { InsuranceCategoryResponseDto } from "../../../enrollment/types";
import {
  handleSessionExpiry,
  isForbidden,
} from "../../../hooks/session-guard";
import {
  createCategoryAction,
  replaceRequirementsAction,
  setEligibilityRuleAction,
  updateCategoryAction,
} from "../actions";
import { ADMIN_CATEGORIES_QUERY_KEY } from "./query-keys";

/**
 * Shared mutation wiring: success refreshes the admin category caches AND the
 * citizen wizard's category list (same reference data), errors map like the
 * other admin mutations.
 */
function useCategoryMutation<TVars>(
  mutationFn: (variables: TVars) => Promise<InsuranceCategoryResponseDto>,
  successKey: string,
  refetchRequirements = false,
) {
  const queryClient = useQueryClient();
  const t = useTranslations("admin");

  return useMutation<InsuranceCategoryResponseDto, AuthActionError, TVars>({
    mutationFn,
    onSuccess: () => {
      toast.success(t(successKey));
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_QUERY_KEY });
      if (refetchRequirements)
        queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
    onError: (error) => {
      if (error.kind === "validation") {
        toast.error(t("categories.errors.validation"));
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
        toast.error(t("categories.errors.conflict"));
        return;
      }
      toast.error(t("actions.errors.generic"));
    },
  });
}

export function useCreateCategory() {
  return useCategoryMutation(
    async (input: Parameters<typeof createCategoryAction>[0]) => {
      const res = await createCategoryAction(input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "categories.toasts.created",
  );
}

export function useUpdateCategory(categoryId: string) {
  return useCategoryMutation(
    async (input: Parameters<typeof updateCategoryAction>[1]) => {
      const res = await updateCategoryAction(categoryId, input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "categories.toasts.updated",
  );
}

export function useSetEligibilityRule(categoryId: string) {
  return useCategoryMutation(
    async (input: Parameters<typeof setEligibilityRuleAction>[1]) => {
      const res = await setEligibilityRuleAction(categoryId, input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "categories.toasts.ruleUpdated",
    true,
  );
}

export function useReplaceRequirements(categoryId: string) {
  return useCategoryMutation(
    async (documentTypes: string[]) => {
      const res = await replaceRequirementsAction(categoryId, documentTypes);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "categories.toasts.requirementsReplaced",
    true,
  );
}
