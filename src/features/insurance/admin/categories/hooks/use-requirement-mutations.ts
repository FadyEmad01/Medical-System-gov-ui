"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { CATEGORIES_QUERY_KEY } from "../../../enrollment/hooks/use-enrollment";
import type { CategoryDocumentRequirementDto } from "../../../enrollment/types";
import {
  handleSessionExpiry,
  isForbidden,
} from "../../../hooks/session-guard";
import {
  addRequirementAction,
  deleteRequirementAction,
  updateRequirementAction,
} from "../actions";

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
