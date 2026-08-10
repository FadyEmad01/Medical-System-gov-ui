"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";

import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { RegisterFormData } from "../../../validation/register-form";
import { useAutofill } from "../use-autofill";

function AccountStep({ form }: { form: UseFormReturn<RegisterFormData> }) {
  const t = useTranslations("auth");
  const errorText = useCallback(
    (msg?: string) => (msg && t.has(msg) ? t(msg) : (msg ?? "")),
    [t],
  );
  const {
    register,
    formState: { errors },
  } = form;
  const autofill = useAutofill(form);

  return (
    <FieldGroup>
      <Field data-invalid={!!errors.username || undefined}>
        <FieldLabel htmlFor="username">
          {t("username")} <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <Input
            id="username"
            {...register("username")}
            onAnimationStart={autofill("username")}
            aria-invalid={!!errors.username || undefined}
          />
          {errors.username?.message && (
            <FieldError>{errorText(errors.username.message)}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.email || undefined}>
        <FieldLabel htmlFor="email">
          {t("email")}{" "}
          <span className="text-xs text-muted-foreground">
            ({t("optional")})
          </span>
        </FieldLabel>
        <FieldContent>
          <Input
            id="email"
            type="email"
            {...register("email")}
            onAnimationStart={autofill("email")}
            aria-invalid={!!errors.email || undefined}
          />
          {errors.email?.message && (
            <FieldError>{errorText(errors.email.message)}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.password || undefined}>
        <FieldLabel htmlFor="password">
          {t("password")} <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <Input
            id="password"
            type="password"
            {...register("password")}
            onAnimationStart={autofill("password")}
            aria-invalid={!!errors.password || undefined}
          />
          {errors.password?.message && (
            <FieldError>{errorText(errors.password.message)}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.confirmPassword || undefined}>
        <FieldLabel htmlFor="confirmPassword">
          {t("confirmPassword")} <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            onAnimationStart={autofill("confirmPassword")}
            aria-invalid={!!errors.confirmPassword || undefined}
          />
          {errors.confirmPassword?.message && (
            <FieldError>{errorText(errors.confirmPassword.message)}</FieldError>
          )}
        </FieldContent>
      </Field>
    </FieldGroup>
  );
}

export { AccountStep };
