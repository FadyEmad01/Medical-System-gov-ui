"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import {
  handleSessionExpiry,
  isForbidden,
} from "../../../hooks/session-guard";

/**
 * Toast mapping for verification workbench mutations — session purge,
 * validation, forbidden, not-found, then generic.
 */
export function useVerificationMutationError() {
  const t = useTranslations("admin");
  const queryClient = useQueryClient();

  return (error: AuthActionError) => {
    if (handleSessionExpiry(queryClient, error)) {
      toast.error(t("actions.errors.sessionExpired"));
      return;
    }
    if (error.kind === "validation") {
      toast.error(t("verification.errors.reason"));
      return;
    }
    if (isForbidden(error)) {
      toast.error(t("actions.errors.forbidden"));
      return;
    }
    if (error.kind === "notFound") {
      toast.error(t("verification.errors.notFound"));
      return;
    }
    toast.error(t("actions.errors.generic"));
  };
}
