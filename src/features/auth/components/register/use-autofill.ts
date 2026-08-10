import type { AnimationEvent } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { RegisterFormData } from "../../validation/register-form";

type AutofillFieldName = Exclude<
  keyof RegisterFormData,
  "gender" | "governorate"
>;

export function useAutofill(form: UseFormReturn<RegisterFormData>) {
  return (name: AutofillFieldName) =>
    (event: AnimationEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      if (value === "") return;
      form.setValue(name, value, { shouldValidate: true });
    };
}
