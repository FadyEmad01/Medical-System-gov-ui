import { z } from "zod";

export const loginFormSchema = z.object({
  nationalId: z
    .string()
    .min(1, "errors.nationalIdRequired")
    .regex(/^\d{14}$/, "errors.nationalIdDigits"),
  password: z.string().min(1, "errors.passwordRequired"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
