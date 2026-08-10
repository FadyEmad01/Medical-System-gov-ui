"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  type LoginFormData,
  loginFormSchema,
} from "../../validation/login-form";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const t = useTranslations("auth");
  const errorText = useCallback(
    (msg?: string) => (msg && t.has(msg) ? t(msg) : (msg ?? "")),
    [t],
  );

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    mode: "onChange",
    defaultValues: {
      nationalId: "",
      password: "",
    },
  });

  const {
    register,
    formState: { errors },
  } = form;

  const handleSubmit = (data: LoginFormData) => {
    console.log(data);
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold">{t("loginTitle")}</h1>
          <p className="text-sm text-balance text-muted-foreground">
            {t("loginDescription")}
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="nationalId">{t("nationalId")}</FieldLabel>
          <Input
            id="nationalId"
            inputMode="numeric"
            placeholder="XXXXXXXXXXXXXX"
            {...register("nationalId")}
            aria-invalid={!!errors.nationalId || undefined}
          />
          {errors.nationalId?.message && (
            <FieldError>{errorText(errors.nationalId.message)}</FieldError>
          )}
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
            <a
              href="#forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              {t("forgotPassword")}
            </a>
          </div>
          <Input
            id="password"
            type="password"
            {...register("password")}
            aria-invalid={!!errors.password || undefined}
          />
          {errors.password?.message && (
            <FieldError>{errorText(errors.password.message)}</FieldError>
          )}
        </Field>
        <Field>
          <Button type="submit">{t("login")}</Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            {t("noAccount")}{" "}
            <Link
              href="/auth/register"
              className="underline underline-offset-4"
            >
              {t("register")}
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
