import { z } from "zod";

export const MARITAL_STATUS_VALUES = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
] as const;

export const editProfileSchema = z.object({
  occupation: z.string().optional(),
  maritalStatus: z.enum(MARITAL_STATUS_VALUES, {
    required_error: "profile.field.maritalStatusRequired",
  }),
  nationality: z.string().optional(),
  preferredLanguage: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

export type EditProfileFormData = z.infer<typeof editProfileSchema>;

/**
 * Normalizes a form value for the update payload: trims surrounding
 * whitespace and maps empty strings to `null` so the backend clears the
 * field. `undefined` passes through untouched (field not submitted).
 */
export function toNullableString(
  value: string | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
