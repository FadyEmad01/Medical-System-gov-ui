import { z } from "zod";
import type { AddDependentRequestDto } from "../types";

export const GENDER_VALUES = ["Male", "Female"] as const;

export const RELATIONSHIP_TYPE_VALUES = [
  "Spouse",
  "Child",
  "Parent",
  "Guardian",
] as const;

/**
 * Client-side schema for the "add dependent" dialog. Mirrors the server
 * boundary (`dependents.errors.*`): four required name parts (trimmed, ≤50),
 * a required date, known enum values, and a 14-digit national ID when given.
 */
export const addDependentSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "dependents.errors.invalidName")
    .max(50, "dependents.errors.invalidName"),
  secondName: z
    .string()
    .trim()
    .min(1, "dependents.errors.invalidName")
    .max(50, "dependents.errors.invalidName"),
  thirdName: z
    .string()
    .trim()
    .min(1, "dependents.errors.invalidName")
    .max(50, "dependents.errors.invalidName"),
  fourthName: z
    .string()
    .trim()
    .min(1, "dependents.errors.invalidName")
    .max(50, "dependents.errors.invalidName"),
  dateOfBirth: z.string().min(1, "dependents.errors.dateOfBirthRequired"),
  gender: z.enum(GENDER_VALUES, {
    required_error: "dependents.errors.genderRequired",
  }),
  relationshipType: z.enum(RELATIONSHIP_TYPE_VALUES, {
    required_error: "dependents.errors.relationshipRequired",
  }),
  nationalId: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d{14}$/.test(value),
      "dependents.errors.nationalId",
    ),
});

export type AddDependentFormValues = z.infer<typeof addDependentSchema>;

export const ADD_DEPENDENT_DEFAULT_VALUES: AddDependentFormValues = {
  firstName: "",
  secondName: "",
  thirdName: "",
  fourthName: "",
  dateOfBirth: "",
  gender: "Male",
  relationshipType: "Spouse",
  nationalId: "",
};

/**
 * Converts validated form values into the API request, omitting an empty
 * national ID so the JSON payload stays minimal.
 */
export function toAddDependentRequest(
  values: AddDependentFormValues,
): AddDependentRequestDto {
  return {
    firstName: values.firstName,
    secondName: values.secondName,
    thirdName: values.thirdName,
    fourthName: values.fourthName,
    dateOfBirth: values.dateOfBirth,
    gender: values.gender,
    relationshipType: values.relationshipType,
    ...(values.nationalId !== "" ? { nationalId: values.nationalId } : {}),
  };
}
