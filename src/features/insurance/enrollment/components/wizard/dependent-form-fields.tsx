"use client";

import { useTranslations } from "next-intl";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldError,
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
import {
  type AddDependentFormValues,
  GENDER_VALUES,
  RELATIONSHIP_TYPE_VALUES,
} from "../../validation/dependent-form";

const NAME_FIELDS = [
  "firstName",
  "secondName",
  "thirdName",
  "fourthName",
] as const;

/** Field grid for the add-dependent form (name, DOB, gender, relationship, national ID). */
export function DependentFormFields({
  register,
  watch,
  setValue,
  errors,
  errorText,
}: {
  register: UseFormRegister<AddDependentFormValues>;
  watch: UseFormWatch<AddDependentFormValues>;
  setValue: UseFormSetValue<AddDependentFormValues>;
  errors: FieldErrors<AddDependentFormValues>;
  errorText: (msg?: string) => string;
}) {
  const t = useTranslations("insurance");

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {NAME_FIELDS.map((name) => (
          <Field key={name} data-invalid={!!errors[name] || undefined}>
            <FieldLabel htmlFor={name}>
              {t(`dependents.fields.${name}`)}
            </FieldLabel>
            <FieldContent>
              <Input
                id={name}
                {...register(name)}
                aria-invalid={!!errors[name] || undefined}
              />
              {errors[name]?.message ? (
                <FieldError>{errorText(errors[name].message)}</FieldError>
              ) : null}
            </FieldContent>
          </Field>
        ))}
      </div>

      <Field data-invalid={!!errors.dateOfBirth || undefined}>
        <FieldLabel htmlFor="dateOfBirth">
          {t("dependents.fields.dateOfBirth")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="dateOfBirth"
            type="date"
            {...register("dateOfBirth")}
            aria-invalid={!!errors.dateOfBirth || undefined}
          />
          {errors.dateOfBirth?.message ? (
            <FieldError>{errorText(errors.dateOfBirth.message)}</FieldError>
          ) : null}
        </FieldContent>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field data-invalid={!!errors.gender || undefined}>
          <FieldLabel>{t("dependents.fields.gender")}</FieldLabel>
          <FieldContent>
            <Select
              value={watch("gender")}
              onValueChange={(value) =>
                setValue(
                  "gender",
                  value as AddDependentFormValues["gender"],
                  {
                    shouldValidate: true,
                  },
                )
              }
            >
              <SelectTrigger
                className="w-full bg-secondary"
                aria-invalid={!!errors.gender || undefined}
              >
                <SelectValue placeholder={t("dependents.fields.gender")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup className="p-0">
                  {GENDER_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`dependents.gender.${value}`)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.gender?.message ? (
              <FieldError>{errorText(errors.gender.message)}</FieldError>
            ) : null}
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.relationshipType || undefined}>
          <FieldLabel>{t("dependents.fields.relationshipType")}</FieldLabel>
          <FieldContent>
            <Select
              value={watch("relationshipType")}
              onValueChange={(value) =>
                setValue(
                  "relationshipType",
                  value as AddDependentFormValues["relationshipType"],
                  { shouldValidate: true },
                )
              }
            >
              <SelectTrigger
                className="w-full bg-secondary"
                aria-invalid={!!errors.relationshipType || undefined}
              >
                <SelectValue
                  placeholder={t("dependents.fields.relationshipType")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup className="p-0">
                  {RELATIONSHIP_TYPE_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`dependents.relationship.${value}`)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.relationshipType?.message ? (
              <FieldError>
                {errorText(errors.relationshipType.message)}
              </FieldError>
            ) : null}
          </FieldContent>
        </Field>
      </div>

      <Field data-invalid={!!errors.nationalId || undefined}>
        <FieldLabel htmlFor="nationalId">
          {t("dependents.fields.nationalId")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="nationalId"
            inputMode="numeric"
            {...register("nationalId")}
            aria-invalid={!!errors.nationalId || undefined}
          />
          {errors.nationalId?.message ? (
            <FieldError>{errorText(errors.nationalId.message)}</FieldError>
          ) : null}
        </FieldContent>
      </Field>
    </>
  );
}
