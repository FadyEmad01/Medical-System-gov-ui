"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { isForbidden } from "../../../hooks/session-guard";

/**
 * Toast mapping shared by the verification workbench mutations — validation,
 * forbidden, session-expiry, not-found, then generic.
 */
export function useVerificationMutationError() {
  const t = useTranslations("admin");
  return (error: AuthActionError) => {
    if (error.kind === "validation") {
      toast.error(t("verification.errors.reason"));
      return;
    }
    if (isForbidden(error)) {
      toast.error(t("actions.errors.forbidden"));
      return;
    }
    if (error.kind === "unauthorized") {
      toast.error(t("actions.errors.sessionExpired"));
      return;
    }
    if (error.kind === "notFound") {
      toast.error(t("verification.errors.notFound"));
      return;
    }
    toast.error(t("actions.errors.generic"));
  };
}
