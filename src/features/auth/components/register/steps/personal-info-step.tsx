"use client";

import { format, parse } from "date-fns";
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
import { GENDER_OPTIONS } from "../../../constants/register-options";
import type { RegisterFormData } from "../../../validation/register-form";
import { DatePicker } from "../date-picker";
import { useAutofill } from "../use-autofill";

function PersonalInfoStep({ form }: { form: UseFormReturn<RegisterFormData> }) {
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

  const dob = watch("dateOfBirth");
  const dobDate = dob ? parse(dob, "yyyy-MM-dd", new Date()) : undefined;

  return (
    <FieldGroup>
      <div className="grid grid-cols-2 gap-4">
        <Field data-invalid={!!errors.firstName || undefined}>
          <FieldLabel htmlFor="firstName">
            {t("firstName")} <span className="text-destructive">*</span>
          </FieldLabel>
          <FieldContent>
            <Input
              id="firstName"
              placeholder="Mohamed"
              {...register("firstName")}
              onAnimationStart={autofill("firstName")}
              aria-invalid={!!errors.firstName || undefined}
            />
            {errors.firstName?.message && (
              <FieldError>{errorText(errors.firstName.message)}</FieldError>
            )}
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.secondName || undefined}>
          <FieldLabel htmlFor="secondName">
            {t("secondName")} <span className="text-destructive">*</span>
          </FieldLabel>
          <FieldContent>
            <Input
              id="secondName"
              placeholder="Ahmed"
              {...register("secondName")}
              onAnimationStart={autofill("secondName")}
              aria-invalid={!!errors.secondName || undefined}
            />
            {errors.secondName?.message && (
              <FieldError>{errorText(errors.secondName.message)}</FieldError>
            )}
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.thirdName || undefined}>
          <FieldLabel htmlFor="thirdName">
            {t("thirdName")} <span className="text-destructive">*</span>
          </FieldLabel>
          <FieldContent>
            <Input
              id="thirdName"
              placeholder="Mahmoud"
              {...register("thirdName")}
              onAnimationStart={autofill("thirdName")}
              aria-invalid={!!errors.thirdName || undefined}
            />
            {errors.thirdName?.message && (
              <FieldError>{errorText(errors.thirdName.message)}</FieldError>
            )}
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.fourthName || undefined}>
          <FieldLabel htmlFor="fourthName">
            {t("fourthName")} <span className="text-destructive">*</span>
          </FieldLabel>
          <FieldContent>
            <Input
              id="fourthName"
              placeholder="Ali"
              {...register("fourthName")}
              onAnimationStart={autofill("fourthName")}
              aria-invalid={!!errors.fourthName || undefined}
            />
            {errors.fourthName?.message && (
              <FieldError>{errorText(errors.fourthName.message)}</FieldError>
            )}
          </FieldContent>
        </Field>
      </div>

      <Field data-invalid={!!errors.nationalId || undefined}>
        <FieldLabel htmlFor="nationalId">
          {t("nationalId")} <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <Input
            id="nationalId"
            placeholder="XXXXXXXXXXXXXX"
            {...register("nationalId")}
            onAnimationStart={autofill("nationalId")}
            aria-invalid={!!errors.nationalId || undefined}
          />
          {errors.nationalId?.message && (
            <FieldError>{errorText(errors.nationalId.message)}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.dateOfBirth || undefined}>
        <FieldLabel htmlFor="date-of-birth">
          {t("dateOfBirth")} <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <DatePicker
            id="date-of-birth"
            value={dobDate}
            onChange={(d) =>
              setValue("dateOfBirth", d ? format(d, "yyyy-MM-dd") : "", {
                shouldValidate: true,
              })
            }
            aria-invalid={!!errors.dateOfBirth || undefined}
          />
          {errors.dateOfBirth?.message && (
            <FieldError>{errorText(errors.dateOfBirth.message)}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.gender || undefined}>
        <FieldLabel>
          {t("gender")} <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <Select
            value={watch("gender")}
            onValueChange={(v) =>
              setValue("gender", v as "Male" | "Female", {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger
              className="w-full bg-secondary"
              aria-invalid={!!errors.gender || undefined}
            >
              <SelectValue placeholder={t("selectGender")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup className="p-0">
                {GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.label)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.gender?.message && (
            <FieldError>{errorText(errors.gender.message)}</FieldError>
          )}
        </FieldContent>
      </Field>
    </FieldGroup>
  );
}

export { PersonalInfoStep };
