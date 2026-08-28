/**
 * Medication rows are all-or-nothing per the New Visit form contract (§6.8):
 * MedicineName, Dosage, Frequency, Duration are required together if any is
 * filled. An entirely empty row is simply omitted from the payload.
 */

import type { MedicationRowInput } from "../types";
import {
  DOSAGE_MAX,
  DURATION_MAX,
  FREQUENCY_MAX,
  MEDICINE_NAME_MAX,
} from "./constants";

export type MedicationRowDraft = {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
};

export type MedicationRowIssue = "incomplete" | "tooLong";

export type MedicationRowsResult =
  | { ok: true; rows: MedicationRowInput[] }
  | { ok: false; issue: MedicationRowIssue; rowIndex: number };

const LIMITS: Record<keyof MedicationRowDraft, number> = {
  medicineName: MEDICINE_NAME_MAX,
  dosage: DOSAGE_MAX,
  frequency: FREQUENCY_MAX,
  duration: DURATION_MAX,
};

function isEmptyRow(row: MedicationRowDraft): boolean {
  return Object.values(row).every((value) => value.trim() === "");
}

export function parseMedicationRows(
  drafts: MedicationRowDraft[],
): MedicationRowsResult {
  for (const [index, row] of drafts.entries()) {
    if (isEmptyRow(row)) continue;

    const filled = Object.entries(row) as [keyof MedicationRowDraft, string][];
    if (filled.some(([, value]) => value.trim() === "")) {
      return { ok: false, issue: "incomplete", rowIndex: index };
    }
    const tooLong = filled.find(([field, value]) => {
      const limit = LIMITS[field];
      return value.trim().length > limit;
    });
    if (tooLong) return { ok: false, issue: "tooLong", rowIndex: index };
  }

  return {
    ok: true,
    rows: drafts
      .filter((row) => !isEmptyRow(row))
      .map((row) => ({
        medicineName: row.medicineName.trim(),
        dosage: row.dosage.trim(),
        frequency: row.frequency.trim(),
        duration: row.duration.trim(),
      })),
  };
}
