"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * Resolves a message that may be a translation key (Server Action errors) or a
 * plain string (Zod resolver messages). Shared by `FormError` and `FieldError`
 * consumers so both render translation keys the same way.
 */
export function useErrorText() {
  const t = useTranslations("auth");
  return useCallback(
    (msg?: string) => (msg && t.has(msg) ? t(msg) : (msg ?? "")),
    [t],
  );
}

/**
 * Renders a root-level form error.
 *
 * Messages coming from Server Actions are translation keys (e.g.
 * `errors.invalidCredentials`) while Zod resolver messages are plain strings —
 * this component resolves either by translating only when the key exists.
 */
export function FormError({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  const errorText = useErrorText();
  if (!message) return null;
  return (
    <p
      role="alert"
      className={cn(
        "rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive",
        className,
      )}
    >
      {errorText(message)}
    </p>
  );
}
