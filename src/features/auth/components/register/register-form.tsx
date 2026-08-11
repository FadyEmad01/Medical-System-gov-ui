"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Link, useRouter } from "@/i18n/navigation";
import { useRegister } from "../../hooks/use-auth";
import { applyActionError } from "../../lib/apply-action-error";
import {
  accountSchema,
  contactSchema,
  personalInfoSchema,
  type RegisterFormData,
  registerFormSchema,
} from "../../validation/register-form";
import { FormError } from "../form-error";
import RegisterStepper from "./register-stepper";
import { AccountStep } from "./steps/account-step";
import { ContactStep } from "./steps/contact-step";
import { PersonalInfoStep } from "./steps/personal-info-step";

const STEP_COUNT = 3;

/** Fields owned by each step, in step order — drives step navigation. */
const STEP_FIELD_KEYS: ReadonlyArray<readonly (keyof RegisterFormData)[]> = [
  [
    "nationalId",
    "firstName",
    "secondName",
    "thirdName",
    "fourthName",
    "dateOfBirth",
    "gender",
  ],
  ["mobileNumber", "governorate", "district", "address"],
  ["username", "email", "password", "confirmPassword"],
];

/**
 * Maps validation errors back to the step that owns them. Returns the
 * highest-numbered step with an error so the user lands where the first thing
 * to fix actually lives; `null` when the failure is root-level only.
 */
function findFailedStep(
  errors: FieldErrors<RegisterFormData>,
): 0 | 1 | 2 | null {
  if (errors.root?.message) return null;
  for (let i = STEP_COUNT - 1; i >= 0; i--) {
    if (STEP_FIELD_KEYS[i].some((key) => errors[key])) return i as 0 | 1 | 2;
  }
  return null;
}

/**
 * Strip client-only fields and trim empty optionals so the payload matches
 * `RegisterRequest` (no confirmPassword, email only when provided).
 */
function toRegisterRequest(data: RegisterFormData) {
  const { confirmPassword, email, ...rest } = data;
  return { ...rest, email: email ? email : undefined };
}

function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const register = useRegister();
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    mode: "onChange",
    defaultValues: {
      nationalId: "",
      firstName: "",
      secondName: "",
      thirdName: "",
      fourthName: "",
      dateOfBirth: "",
      gender: undefined,
      mobileNumber: "",
      governorate: "",
      district: "",
      address: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [step, setStep] = useState(0);
  const stepSchemas = [personalInfoSchema, contactSchema, accountSchema];

  const validateStep = async (s: number) => {
    const fields = Object.keys(
      stepSchemas[s].shape,
    ) as (keyof RegisterFormData)[];
    return form.trigger(fields);
  };

  const handleNext = async () => {
    const valid = await validateStep(step);
    if (valid) setStep((prev) => Math.min(prev + 1, STEP_COUNT - 1));
  };

  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleStepperChange = (next: number) => {
    if (next < step) {
      setStep(next);
    } else if (next > step) {
      void validateStep(step).then((valid) => {
        if (valid) setStep(next);
      });
    }
  };

  // Re-validate confirmPassword whenever password changes: RHF only updates the
  // changed field's error slot, so the mismatch error would otherwise go stale.
  const passwordValue = form.watch("password");
  useEffect(() => {
    if (passwordValue) form.trigger("confirmPassword");
  }, [passwordValue, form]);

  /**
   * Submitting the form (submit button or Enter key) advances through the
   * steps first — RHF's handleSubmit validates the whole schema, so we gate
   * the real submission behind the final step.
   */
  const onSubmit = form.handleSubmit(async (data) => {
    if (step < STEP_COUNT - 1) {
      const valid = await validateStep(step);
      if (valid) setStep((prev) => Math.min(prev + 1, STEP_COUNT - 1));
      return;
    }

    try {
      await register.mutateAsync(toRegisterRequest(data));
      router.replace({ pathname: "/dashboard" });
    } catch (raw) {
      applyActionError(raw, form);
      // Bounce back to the first step that owns a field with an error so the
      // user actually sees what failed — server errors can target any field.
      const failedStep = findFailedStep(form.formState.errors);
      if (failedStep !== null) setStep(failedStep);
    }
  });

  const submitting = register.isPending;

  return (
    <form className="flex flex-col gap-6 mt-10" onSubmit={onSubmit}>
      <div className="flex flex-col items-start gap-1">
        <h1 className="text-2xl font-bold">{t("createYourAccount")}</h1>
        <p className="text-sm text-balance text-muted-foreground">
          {t("fillFormBelow")}
        </p>
        <RegisterStepper value={step} onValueChange={handleStepperChange} />
      </div>

      {form.formState.errors.root?.message && (
        <FormError message={form.formState.errors.root.message} />
      )}

      <FieldGroup>
        {step === 0 && <PersonalInfoStep form={form} />}
        {step === 1 && <ContactStep form={form} />}
        {step === 2 && <AccountStep form={form} />}
      </FieldGroup>

      {step === 0 ? (
        <Button
          type="button"
          onClick={handleNext}
          className="w-full"
          disabled={submitting}
        >
          {t("next")}
        </Button>
      ) : (
        <div className="grid w-full grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={submitting}
          >
            {t("back")}
          </Button>
          <Button
            type="button"
            onClick={step < STEP_COUNT - 1 ? handleNext : () => void onSubmit()}
            disabled={submitting}
          >
            {submitting
              ? t("submitting")
              : step < STEP_COUNT - 1
                ? t("next")
                : t("submit")}
          </Button>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link
          href="/auth/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("login")}
        </Link>
      </p>
    </form>
  );
}

export { RegisterForm };
