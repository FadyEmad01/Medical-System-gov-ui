import { z } from "zod";

export const personalInfoSchema = z.object({
  nationalId: z
    .string()
    .min(1, "errors.nationalIdRequired")
    .regex(/^\d{14}$/, "errors.nationalIdDigits"),
  firstName: z.string().min(2, "errors.nameMinLength"),
  secondName: z.string().min(2, "errors.nameMinLength"),
  thirdName: z.string().min(2, "errors.nameMinLength"),
  fourthName: z.string().min(2, "errors.nameMinLength"),
  dateOfBirth: z.string().min(1, "errors.dateOfBirthRequired"),
  gender: z.enum(["Male", "Female"], {
    required_error: "errors.genderRequired",
  }),
});

export const contactSchema = z.object({
  mobileNumber: z
    .string()
    .min(1, "errors.mobileNumberRequired")
    .regex(/^01[0-9]\d{8}$/, "errors.mobileNumberFormat"),
  governorate: z.string().min(1, "errors.governorateRequired"),
  district: z.string().min(1, "errors.districtRequired"),
  address: z.string().min(5, "errors.addressMinLength"),
});

export const accountSchema = z.object({
  username: z
    .string()
    .min(3, "errors.usernameMinLength")
    .regex(/^[a-zA-Z0-9_]+$/, "errors.usernameFormat"),
  email: z.string().email("errors.emailInvalid").optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "errors.passwordMinLength")
    .regex(/(?=.*\d)(?=.*[a-zA-Z])(?=.*[^a-zA-Z0-9])/, "errors.passwordFormat"),
  confirmPassword: z.string().min(1, "errors.confirmPasswordRequired"),
});

export const registerFormSchema = personalInfoSchema
  .merge(contactSchema)
  .merge(accountSchema)
  .refine((data) => data.password === data.confirmPassword, {
    message: "errors.passwordMismatch",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerFormSchema>;

export const REQUIRED_FIELDS = [
  "nationalId",
  "firstName",
  "secondName",
  "thirdName",
  "fourthName",
  "dateOfBirth",
  "gender",
  "mobileNumber",
  "governorate",
  "district",
  "address",
  "username",
  "password",
  "confirmPassword",
] as const;
