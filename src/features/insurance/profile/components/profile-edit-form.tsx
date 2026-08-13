"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { type RefObject, useCallback } from "react";
import { type FieldPath, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { isAuthActionError } from "../../hooks/session-guard";
import { useUpdateProfile } from "../../hooks/use-profile";
import type { MaritalStatus, ProfileResponseDto } from "../../types";
import {
  type EditProfileFormData,
  editProfileSchema,
  MARITAL_STATUS_VALUES,
  toNullableString,
} from "../validation/profile-form";

export function ProfileEditForm({
  profile,
  formRef,
  onCancel,
  onSaved,
}: {
  profile: ProfileResponseDto;
  formRef: RefObject<HTMLFormElement | null>;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("insurance");
  const updateProfile = useUpdateProfile();
  const form = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    mode: "onChange",
    defaultValues: {
      occupation: profile.occupation ?? "",
      maritalStatus: profile.maritalStatus ?? undefined,
      nationality: profile.nationality ?? "",
      preferredLanguage: profile.preferredLanguage ?? "",
      emergencyContactName: profile.emergencyContactName ?? "",
      emergencyContactPhone: profile.emergencyContactPhone ?? "",
    },
  });
  const errorText = useCallback(
    (msg?: string) => (msg && t.has(msg) ? t(msg) : (msg ?? "")),
    [t],
  );
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync({
        occupation: toNullableString(values.occupation),
        maritalStatus: values.maritalStatus,
        nationality: toNullableString(values.nationality),
        preferredLanguage: toNullableString(values.preferredLanguage),
        emergencyContactName: toNullableString(values.emergencyContactName),
        emergencyContactPhone: toNullableString(values.emergencyContactPhone),
      });
      onSaved();
    } catch (raw) {
      const actionError = isAuthActionError(raw) ? raw : undefined;
      for (const [key, message] of Object.entries(
        actionError?.fieldErrors ?? {},
      )) {
        if (typeof message !== "string") continue;
        if (!(key in form.getValues())) continue;
        form.setError(key as FieldPath<EditProfileFormData>, {
          type: "server",
          message,
        });
      }
    }
  });

  const isPending = updateProfile.isPending;

  return (
    <form
      id="profile-edit-form"
      ref={formRef}
      className="outline-none"
      onSubmit={onSubmit}
    >
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

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          {t("profile.cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" />}
          {isPending ? t("profile.saving") : t("profile.save")}
        </Button>
      </div>
    </form>
  );
}
