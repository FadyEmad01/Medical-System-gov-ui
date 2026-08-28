"use server";

import type {
  ActionResult,
  AuthActionError,
} from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import { validateDocumentFile } from "@/features/insurance/enrollment/lib/file-validation";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "@/features/insurance/lib/session-aware-error";
import { ApiError } from "@/lib/api-client";
import {
  addMedications,
  createVisit,
  getDoctorPatients,
  getMedicalSummary,
  getVisit,
  getVisitHistory,
  listAttachments,
  searchPatient,
  updateVisit,
  updateVisitStatus,
  uploadAttachment,
} from "../api/clinical-client";
import {
  DIAGNOSIS_MAX,
  isVisitStatus,
  isVisitType,
  NOTES_MAX,
  REQUIRED_TESTS_MAX,
} from "../lib/constants";
import {
  type MedicationRowDraft,
  parseMedicationRows,
} from "../lib/medication-rows";
import { parseNationalId } from "../lib/parse-national-id";
import type {
  AddMedicationsInput,
  AttachmentMetaDto,
  CreateVisitInput,
  MedicalSummaryDto,
  PatientSummaryDto,
  RosterEntryDto,
  UpdateVisitInput,
  UpdateVisitStatusInput,
  UploadAttachmentInput,
  VisitDetailDto,
  VisitSummaryDto,
} from "../types";

/**
 * Clinical workspace server actions against the live staging API. Every action
 * follows the shared shape: session → boundary validation → API call →
 * structured error.
 */

const VISIT_ID_MAX = 64;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toInvalid(formError: string): { ok: false; error: AuthActionError } {
  return {
    ok: false,
    error: { kind: "validation", formError, fieldErrors: {} },
  };
}

function validId(id: string): boolean {
  return id.trim() !== "" && id.length <= VISIT_ID_MAX;
}

function validPatientId(patientId: number): boolean {
  return Number.isInteger(patientId) && patientId >= 1;
}

/** GET /patients/search?nationalId= — 404 = unknown or no relationship (identical, neutral). */
export async function searchPatientAction(
  nationalId: string,
): Promise<ActionResult<PatientSummaryDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  const id = parseNationalId(nationalId);
  if (id === null) return toInvalid("doctor.errors.invalidNationalId");

  try {
    return { ok: true, data: await searchPatient(token, id) };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /doctors/{doctorId}/patients */
export async function getMyPatientsAction(
  doctorId: number,
): Promise<ActionResult<RosterEntryDto[]>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validPatientId(doctorId)) return toInvalid("doctor.errors.invalidInput");

  try {
    return { ok: true, data: await getDoctorPatients(token, doctorId) };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: [] };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /patients/{patientId}/medical-summary — 404 also covers "no visits yet". */
export async function getMedicalSummaryAction(
  patientId: number,
): Promise<ActionResult<MedicalSummaryDto | null>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validPatientId(patientId))
    return toInvalid("doctor.errors.invalidInput");

  try {
    return { ok: true, data: await getMedicalSummary(token, patientId) };
  } catch (err) {
    // 404 = unknown, inaccessible, or no visits yet — identical neutral result.
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: null };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /patients/{patientId}/visit-history */
export async function getVisitHistoryAction(
  patientId: number,
): Promise<ActionResult<VisitSummaryDto[]>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validPatientId(patientId))
    return toInvalid("doctor.errors.invalidInput");

  try {
    return { ok: true, data: await getVisitHistory(token, patientId) };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: [] };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /visits/{visitId} */
export async function getVisitAction(
  visitId: string,
): Promise<ActionResult<VisitDetailDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validId(visitId)) return toInvalid("doctor.errors.invalidInput");

  try {
    return { ok: true, data: await getVisit(token, visitId) };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** POST /visits */
export async function createVisitAction(
  input: CreateVisitInput,
): Promise<ActionResult<VisitDetailDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  if (
    !validPatientId(input.patientId) ||
    !validPatientId(input.doctorId) ||
    !isVisitType(input.visitType) ||
    !DATE_PATTERN.test(input.visitDate)
  ) {
    return toInvalid("doctor.errors.invalidInput");
  }
  const texts = validateClinicalTexts(
    input.diagnosis,
    input.notes,
    input.requiredTests,
  );
  if (!texts.ok) return texts;
  const medications = parseMedicationRows(
    input.medications as MedicationRowDraft[],
  );
  if (!medications.ok) return toInvalid("doctor.errors.invalidMedicationRow");

  try {
    return {
      ok: true,
      data: await createVisit(token, {
        ...input,
        ...texts.data,
        medications: medications.rows,
      }),
    };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** PUT /visits/{visitId} — full replace; clearing a field genuinely deletes it. */
export async function updateVisitAction(
  visitId: string,
  input: UpdateVisitInput,
): Promise<ActionResult<VisitDetailDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validId(visitId)) return toInvalid("doctor.errors.invalidInput");
  const texts = validateClinicalTexts(
    input.diagnosis,
    input.notes,
    input.requiredTests,
  );
  if (!texts.ok) return texts;

  try {
    return {
      ok: true,
      data: await updateVisit(token, visitId, {
        diagnosis: texts.data.diagnosis ?? "",
        notes: texts.data.notes ?? "",
        requiredTests: texts.data.requiredTests ?? "",
      }),
    };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** PATCH /visits/{visitId}/status */
export async function updateVisitStatusAction(
  input: UpdateVisitStatusInput,
): Promise<ActionResult<VisitDetailDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validId(input.visitId) || !isVisitStatus(input.status)) {
    return toInvalid("doctor.errors.invalidInput");
  }

  try {
    return { ok: true, data: await updateVisitStatus(token, input) };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** POST /visits/{visitId}/medications — batch body; 409 when the visit is closed. */
export async function addMedicationsAction(
  input: AddMedicationsInput,
): Promise<ActionResult<VisitDetailDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  const rows = parseMedicationRows(input.medications as MedicationRowDraft[]);
  if (!validId(input.visitId) || !rows.ok || rows.rows.length === 0) {
    return toInvalid("doctor.errors.invalidMedicationRow");
  }

  try {
    return {
      ok: true,
      data: await addMedications(token, {
        visitId: input.visitId,
        medications: rows.rows,
      }),
    };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /visits/{visitId}/attachments */
export async function listAttachmentsAction(
  visitId: string,
): Promise<ActionResult<AttachmentMetaDto[]>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validId(visitId)) return toInvalid("doctor.errors.invalidInput");

  try {
    return { ok: true, data: await listAttachments(token, visitId) };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: [] };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** POST /visits/{visitId}/attachments — same file rules as insurance documents. */
export async function uploadAttachmentAction(
  input: UploadAttachmentInput,
): Promise<ActionResult<AttachmentMetaDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };
  if (!validId(input.visitId) || !validateDocumentFile(input.file).ok) {
    return toInvalid("doctor.attachments.errors.invalidFile");
  }

  try {
    return { ok: true, data: await uploadAttachment(token, input) };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

type ClinicalTexts = {
  diagnosis?: string;
  notes?: string;
  requiredTests?: string;
};

/** Shared trim + cap check for the three clinical narrative fields. */
function validateClinicalTexts(
  diagnosis: string | undefined,
  notes: string | undefined,
  requiredTests: string | undefined,
): { ok: true; data: ClinicalTexts } | { ok: false; error: AuthActionError } {
  const diagnosisTrimmed = (diagnosis ?? "").trim();
  const notesTrimmed = (notes ?? "").trim();
  const testsTrimmed = (requiredTests ?? "").trim();
  if (
    diagnosisTrimmed.length > DIAGNOSIS_MAX ||
    notesTrimmed.length > NOTES_MAX ||
    testsTrimmed.length > REQUIRED_TESTS_MAX
  ) {
    return toInvalid("doctor.errors.invalidInput");
  }
  return {
    ok: true,
    data: {
      ...(diagnosisTrimmed ? { diagnosis: diagnosisTrimmed } : {}),
      ...(notesTrimmed ? { notes: notesTrimmed } : {}),
      ...(testsTrimmed ? { requiredTests: testsTrimmed } : {}),
    },
  };
}
