"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useActionMutationError } from "../../../hooks/use-action-mutation-error";

/**
 * Toast mapping for verification workbench mutations — session purge,
 * validation, forbidden, not-found, then generic.
 */
export function useVerificationMutationError() {
  const t = useTranslations("admin");
  return useActionMutationError({
    onSessionExpired: () => toast.error(t("actions.errors.sessionExpired")),
    onForbidden: () => toast.error(t("actions.errors.forbidden")),
    onValidation: () => toast.error(t("verification.errors.reason")),
    onNotFound: () => toast.error(t("verification.errors.notFound")),
    onGeneric: () => toast.error(t("actions.errors.generic")),
  });
}
