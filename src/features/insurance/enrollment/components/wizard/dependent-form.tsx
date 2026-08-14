"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
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
import { isAuthActionError } from "../../../hooks/session-guard";
import { useAddDependent } from "../../hooks/use-enrollment";
import {
  ADD_DEPENDENT_DEFAULT_VALUES,
  type AddDependentFormValues,
  addDependentSchema,
  GENDER_VALUES,
  RELATIONSHIP_TYPE_VALUES,
  toAddDependentRequest,
} from "../../validation/dependent-form";

const NAME_FIELDS = [
  "firstName",
  "secondName",
  "thirdName",
  "fourthName",
] as const;

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
