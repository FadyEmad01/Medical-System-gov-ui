"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Link } from "@/i18n/navigation";
import {
  accountSchema,
  contactSchema,
  personalInfoSchema,
  type RegisterFormData,
  registerFormSchema,
} from "../../validation/register-form";
import RegisterStepper from "./register-stepper";
import { AccountStep } from "./steps/account-step";
import { ContactStep } from "./steps/contact-step";
import { PersonalInfoStep } from "./steps/personal-info-step";

function RegisterForm() {
  const t = useTranslations("auth");
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
    if (valid) setStep((prev) => Math.min(prev + 1, 2));
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

  const handleSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) return;
    console.log("Register payload (no backend):", form.getValues());
  };

  return (
    <div className="flex flex-col gap-6 mt-10">
      <div className="flex flex-col items-start gap-1">
        <h1 className="text-2xl font-bold">{t("createYourAccount")}</h1>
        <p className="text-sm text-balance text-muted-foreground">
          {t("fillFormBelow")}
        </p>
        <RegisterStepper value={step} onValueChange={handleStepperChange} />
      </div>

      <FieldGroup>
        {step === 0 && <PersonalInfoStep form={form} />}
        {step === 1 && <ContactStep form={form} />}
        {step === 2 && <AccountStep form={form} />}
      </FieldGroup>

      {step === 0 ? (
        <Button type="button" onClick={handleNext} className="w-full">
          {t("next")}
        </Button>
      ) : (
        <div className="grid w-full grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={handleBack}>
            {t("back")}
          </Button>
          <Button type="button" onClick={step < 2 ? handleNext : handleSubmit}>
            {step < 2 ? t("next") : t("submit")}
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
    </div>
  );
}

export { RegisterForm };
