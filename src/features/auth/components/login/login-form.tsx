"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { Link, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useLogin } from "../../hooks/use-auth";
import { applyActionError } from "../../lib/apply-action-error";
import {
  type LoginFormData,
  loginFormSchema,
} from "../../validation/login-form";
import { FormError, useErrorText } from "../form-error";

/**
 * Validates and normalizes the `?from=` redirect target the proxy sets when
 * bouncing unauthenticated users. Only same-origin relative paths are
 * accepted; anything else (protocol-relative `//evil.com`, absolute URLs)
 * falls back to the dashboard.
 */
function resolveFromParam(from: string | null): string | null {
  if (!from) return null;
  let path = from.split(/[?#]/)[0];
  for (const locale of routing.locales) {
    const prefix = `/${locale}`;
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      path = path.slice(prefix.length) || "/";
      break;
    }
  }
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const t = useTranslations("auth");
  const router = useRouter();
  const login = useLogin();
  const errorText = useErrorText();
  const searchParams = useSearchParams();
  const from = resolveFromParam(searchParams.get("from"));

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

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await login.mutateAsync({
        nationalId: data.nationalId,
        password: data.password,
      });
      router.replace(from ?? { pathname: "/dashboard" });
    } catch (raw) {
      applyActionError(raw, form);
    }
  });

  return (
    <form
      onSubmit={handleSubmit}
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
        {errors.root?.message && <FormError message={errors.root.message} />}
        <Field>
          <FieldLabel htmlFor="nationalId">{t("nationalId")}</FieldLabel>
          <Input
            id="nationalId"
            inputMode="numeric"
            placeholder="XXXXXXXXXXXXXX"
            disabled={login.isPending}
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
            autoComplete="current-password"
            disabled={login.isPending}
            {...register("password")}
            aria-invalid={!!errors.password || undefined}
          />
          {errors.password?.message && (
            <FieldError>{errorText(errors.password.message)}</FieldError>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={login.isPending}>
            {login.isPending ? t("signingIn") : t("login")}
          </Button>
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
