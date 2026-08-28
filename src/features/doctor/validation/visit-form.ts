import { z } from "zod";
import {
  DIAGNOSIS_MAX,
  NOTES_MAX,
  REQUIRED_TESTS_MAX,
  VISIT_TYPES,
} from "../lib/constants";

/** New Visit form — §6.8: single page, optional repeating medication group. */
export const visitFormSchema = z.object({
  visitDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "doctor.visits.errors.visitDate"),
  visitType: z.enum(VISIT_TYPES, {
    message: "doctor.visits.errors.visitType",
  }),
  diagnosis: z.string().max(DIAGNOSIS_MAX, "doctor.visits.errors.diagnosis"),
  notes: z.string().max(NOTES_MAX, "doctor.visits.errors.notes"),
  requiredTests: z
    .string()
    .max(REQUIRED_TESTS_MAX, "doctor.visits.errors.requiredTests"),
  medications: z.array(
    z.object({
      medicineName: z.string().max(200, "doctor.visits.errors.medicineName"),
      dosage: z.string().max(100, "doctor.visits.errors.medicineName"),
      frequency: z.string().max(100, "doctor.visits.errors.medicineName"),
      duration: z.string().max(100, "doctor.visits.errors.medicineName"),
    }),
  ),
});

export type VisitFormData = z.infer<typeof visitFormSchema>;
