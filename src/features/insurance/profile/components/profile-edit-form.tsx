"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { type RefObject, useCallback } from "react";
import { type FieldPath, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { isAuthActionError } from "../../hooks/session-guard";
import { useUpdateProfile } from "../../hooks/use-profile";
import type { ProfileResponseDto } from "../../types";
import {
  type EditProfileFormData,
  editProfileSchema,
  toNullableString,
} from "../validation/profile-form";
import { ProfileEditFields } from "./profile-edit-fields";

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
      <ProfileEditFields
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
        errorText={errorText}
      />

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
