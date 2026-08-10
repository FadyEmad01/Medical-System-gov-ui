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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GOVERNORATE_OPTIONS } from "../../../constants/register-options";
import type { RegisterFormData } from "../../../validation/register-form";
import { useAutofill } from "../use-autofill";

function ContactStep({ form }: { form: UseFormReturn<RegisterFormData> }) {
  const t = useTranslations("auth");
  const errorText = useCallback(
    (msg?: string) => (msg && t.has(msg) ? t(msg) : (msg ?? "")),
    [t],
  );
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const autofill = useAutofill(form);

  return (
    <FieldGroup>
      <Field data-invalid={!!errors.mobileNumber || undefined}>
        <FieldLabel htmlFor="mobileNumber">
          {t("mobileNumber")} <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <Input
            id="mobileNumber"
            placeholder="01XXXXXXXXX"
            {...register("mobileNumber")}
            onAnimationStart={autofill("mobileNumber")}
            aria-invalid={!!errors.mobileNumber || undefined}
          />
          {errors.mobileNumber?.message && (
            <FieldError>{errorText(errors.mobileNumber.message)}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.governorate || undefined}>
        <FieldLabel>
          {t("governorate")} <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <Select
            value={watch("governorate") || undefined}
            onValueChange={(v) =>
              setValue("governorate", v, { shouldValidate: true })
            }
          >
            <SelectTrigger
              className="w-full bg-secondary"
              aria-invalid={!!errors.governorate || undefined}
            >
              <SelectValue placeholder={t("selectGovernorate")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup className="p-0">
                {GOVERNORATE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.label)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.governorate?.message && (
            <FieldError>{errorText(errors.governorate.message)}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.district || undefined}>
        <FieldLabel htmlFor="district">
          {t("district")} <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <Input
            id="district"
            {...register("district")}
            onAnimationStart={autofill("district")}
            aria-invalid={!!errors.district || undefined}
          />
          {errors.district?.message && (
            <FieldError>{errorText(errors.district.message)}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.address || undefined}>
        <FieldLabel htmlFor="address">
          {t("address")} <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <Input
            id="address"
            {...register("address")}
            onAnimationStart={autofill("address")}
            aria-invalid={!!errors.address || undefined}
          />
          {errors.address?.message && (
            <FieldError>{errorText(errors.address.message)}</FieldError>
          )}
        </FieldContent>
      </Field>
    </FieldGroup>
  );
}

export { ContactStep };
