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
import type { MaritalStatus } from "../../types";
import {
  type EditProfileFormData,
  MARITAL_STATUS_VALUES,
} from "../validation/profile-form";

type ProfileEditFieldsProps = {
  register: UseFormRegister<EditProfileFormData>;
  watch: UseFormWatch<EditProfileFormData>;
  setValue: UseFormSetValue<EditProfileFormData>;
  errors: FieldErrors<EditProfileFormData>;
  errorText: (msg?: string) => string;
};

export function ProfileEditFields({
  register,
  watch,
  setValue,
  errors,
  errorText,
}: ProfileEditFieldsProps) {
  const t = useTranslations("insurance");

  return (
    <FieldGroup className="sm:grid sm:grid-cols-2">
      <Field data-invalid={!!errors.occupation || undefined}>
        <FieldLabel htmlFor="occupation">
          {t("profile.field.occupation")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="occupation"
            {...register("occupation")}
            aria-invalid={!!errors.occupation || undefined}
          />
          {errors.occupation?.message && (
            <FieldError>{errorText(errors.occupation.message)}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.maritalStatus || undefined}>
        <FieldLabel>{t("profile.field.maritalStatus")}</FieldLabel>
        <FieldContent>
          <Select
            value={watch("maritalStatus")}
            onValueChange={(value) =>
              setValue("maritalStatus", value as MaritalStatus, {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger
              className="w-full bg-secondary"
              aria-invalid={!!errors.maritalStatus || undefined}
            >
              <SelectValue placeholder={t("profile.field.maritalStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup className="p-0">
                {MARITAL_STATUS_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`profile.maritalStatus.${value}`)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.maritalStatus?.message && (
            <FieldError>{errorText(errors.maritalStatus.message)}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.nationality || undefined}>
        <FieldLabel htmlFor="nationality">
          {t("profile.field.nationality")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="nationality"
            {...register("nationality")}
            aria-invalid={!!errors.nationality || undefined}
          />
          {errors.nationality?.message && (
            <FieldError>{errorText(errors.nationality.message)}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.preferredLanguage || undefined}>
        <FieldLabel htmlFor="preferredLanguage">
          {t("profile.field.preferredLanguage")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="preferredLanguage"
            {...register("preferredLanguage")}
            aria-invalid={!!errors.preferredLanguage || undefined}
          />
          {errors.preferredLanguage?.message && (
            <FieldError>
              {errorText(errors.preferredLanguage.message)}
            </FieldError>
          )}
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.emergencyContactName || undefined}>
        <FieldLabel htmlFor="emergencyContactName">
          {t("profile.field.emergencyContactName")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="emergencyContactName"
            {...register("emergencyContactName")}
            aria-invalid={!!errors.emergencyContactName || undefined}
          />
          {errors.emergencyContactName?.message && (
            <FieldError>
              {errorText(errors.emergencyContactName.message)}
            </FieldError>
          )}
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.emergencyContactPhone || undefined}>
        <FieldLabel htmlFor="emergencyContactPhone">
          {t("profile.field.emergencyContactPhone")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="emergencyContactPhone"
            inputMode="tel"
            {...register("emergencyContactPhone")}
            aria-invalid={!!errors.emergencyContactPhone || undefined}
          />
          {errors.emergencyContactPhone?.message && (
            <FieldError>
              {errorText(errors.emergencyContactPhone.message)}
            </FieldError>
          )}
        </FieldContent>
      </Field>
    </FieldGroup>
  );
}
