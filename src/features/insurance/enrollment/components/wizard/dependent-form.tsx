"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { type FieldPath, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { isAuthActionError } from "../../../hooks/session-guard";
import { useAddDependent } from "../../hooks/use-enrollment";
import {
  ADD_DEPENDENT_DEFAULT_VALUES,
  type AddDependentFormValues,
  addDependentSchema,
  toAddDependentRequest,
} from "../../validation/dependent-form";
import { DependentFormFields } from "./dependent-form-fields";

/**
 * The "add dependent" dialog body. Mirrors the profile edit form's RHF + zod
 * pattern: client validation via `addDependentSchema`, server field errors
 * mapped back through `setError`, and a success toast from the mutation hook.
 */
export function DependentForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("insurance");
  const addDependent = useAddDependent();
  const form = useForm<AddDependentFormValues>({
    resolver: zodResolver(addDependentSchema),
    mode: "onChange",
    defaultValues: ADD_DEPENDENT_DEFAULT_VALUES,
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

  const isPending = addDependent.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await addDependent.mutateAsync(toAddDependentRequest(values));
      onSaved();
    } catch (raw) {
      const actionError = isAuthActionError(raw) ? raw : undefined;
      for (const [key, message] of Object.entries(
        actionError?.fieldErrors ?? {},
      )) {
        if (typeof message !== "string") continue;
        if (!(key in form.getValues())) continue;
        form.setError(key as FieldPath<AddDependentFormValues>, {
          type: "server",
          message,
        });
      }
    }
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <FieldGroup>
        <DependentFormFields
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          errorText={errorText}
        />
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          {t("dependents.cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Spinner data-icon="inline-start" /> : null}
          {isPending ? t("dependents.saving") : t("dependents.add")}
        </Button>
      </div>
    </form>
  );
}
