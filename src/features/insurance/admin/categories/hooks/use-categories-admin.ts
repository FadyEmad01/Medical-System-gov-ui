"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { useMe } from "@/features/auth/hooks/use-me";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { CATEGORIES_QUERY_KEY } from "../../../enrollment/hooks/use-enrollment";
import type {
  CategoryDocumentRequirementDto,
  InsuranceCategoryResponseDto,
} from "../../../enrollment/types";
import {
  handleSessionExpiry,
  isAuthActionError,
  isForbidden,
  isTerminalActionError,
} from "../../../hooks/session-guard";
import {
  addRequirementAction,
  createCategoryAction,
  deleteRequirementAction,
  getAllCategoriesAction,
  getRequirementsAction,
  setEligibilityRuleAction,
  updateCategoryAction,
  updateRequirementAction,
} from "../actions";

/** Cache keys — inside ["admin"] so session expiry purges them (S1). */
export const ADMIN_CATEGORIES_QUERY_KEY = ["admin", "categories"] as const;
export const REQUIREMENTS_QUERY_KEY = (categoryId: string) =>
  ["admin", "categories", categoryId, "requirements"] as const;

/** Role-gated (S3). */
export function useAllCategories() {
  const queryClient = useQueryClient();
  const meQuery = useMe();
  const enabled = meQuery.data?.role === "Admin";

  const query = useQuery({
    queryKey: ADMIN_CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const res = await getAllCategoriesAction();
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: (failureCount, error) =>
      !(isAuthActionError(error) && isTerminalActionError(error)) &&
      failureCount < 1,
  });

  useEffect(() => {
    if (!isAuthActionError(query.error)) return;
    handleSessionExpiry(queryClient, query.error);
  }, [query.error, queryClient]);

  return query;
}

export function useRequirements(categoryId: string) {
  const meQuery = useMe();
  return useQuery({
    queryKey: REQUIREMENTS_QUERY_KEY(categoryId),
    queryFn: async () => {
      const res = await getRequirementsAction(categoryId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled: meQuery.data?.role === "Admin" && categoryId !== "",
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

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

/** Requirement-row mutations return rows, not the category — same plumbing. */
function useRequirementMutation<TVars>(
  mutationFn: (
    variables: TVars,
  ) => Promise<CategoryDocumentRequirementDto | null>,
  successKey: string,
) {
  const queryClient = useQueryClient();
  const t = useTranslations("admin");

  return useMutation<
    CategoryDocumentRequirementDto | null,
    AuthActionError,
    TVars
  >({
    mutationFn,
    onSuccess: () => {
      toast.success(t(successKey));
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
      toast.error(t("actions.errors.generic"));
    },
  });
}

export function useAddRequirement(categoryId: string) {
  return useRequirementMutation(
    async (input: Parameters<typeof addRequirementAction>[1]) => {
      const res = await addRequirementAction(categoryId, input);
      if (!res.ok) throw res.error;
      return res.data;
    },
    "categories.toasts.requirementAdded",
  );
}

export function useUpdateRequirement(categoryId: string) {
  return useRequirementMutation(
    async (variables: {
      requirementId: string;
      input: Parameters<typeof updateRequirementAction>[2];
    }) => {
      const res = await updateRequirementAction(
        categoryId,
        variables.requirementId,
        variables.input,
      );
      if (!res.ok) throw res.error;
      return res.data;
    },
    "categories.toasts.requirementUpdated",
  );
}

export function useDeleteRequirement(categoryId: string) {
  return useRequirementMutation(async (requirementId: string) => {
    const res = await deleteRequirementAction(categoryId, requirementId);
    if (!res.ok) throw res.error;
    return res.data;
  }, "categories.toasts.requirementDeleted");
}
