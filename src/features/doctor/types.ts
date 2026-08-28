/**
 * Clinical workspace DTOs — captured from the LIVE staging API on 2026-08-28
 * (all endpoints probed with a real Doctor token; see
 * docs/backend-gaps-doctor-clinical.md for the discovery record). The checked-in
 * doctor-swagger.json is stale and does not contain these paths yet.
 *
 * Conventions: ISO date strings (never Date), `| null` for nullable response
 * fields, `?` on optional request fields, `*Input` for request payloads.
 */

export type VisitStatus =
  | "Scheduled"
  | "InProgress"
  | "Completed"
  | "Cancelled";
export type VisitType = "Consultation" | "FollowUp" | "Emergency";
export type Gender = "Male" | "Female";

/** GET /patients/search?nationalId= — exact match; scoped to patients the caller has a visit/assignment with (404 otherwise). */
export interface PatientSummaryDto {
  id: number;
  nationalId: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  mobileNumber: string;
}

/** GET /doctors/{doctorId}/patients — assigned ∪ visit-derived roster. */
export interface RosterEntryDto {
  patientId: number;
  fullName: string;
  nationalId: string;
  mobileNumber: string;
  /** Null → visit-derived only; set → has an assignment row. */
  assignedAt: string | null;
}

/** GET /patients/{patientId}/visit-history — flat chronological rows, no status. */
export interface VisitSummaryDto {
  visitId: string;
  visitDate: string;
  doctorId: number;
  doctorName: string;
  visitType: VisitType;
  diagnosisSummary: string | null;
}

/** GET /patients/{patientId}/medical-summary — flat "latest visit" snapshot. */
export interface MedicalSummaryDto {
  patientId: number;
  fullName: string;
  nationalId: string;
  dateOfBirth: string;
  gender: Gender;
  lastVisit: {
    visitId: string;
    visitDate: string;
    doctorName: string;
    visitType: VisitType;
  } | null;
  latestDiagnosis: string | null;
  latestNotes: string | null;
  latestRequiredTests: string | null;
  latestMedications: { medicationName: string; dosage: string }[];
  latestAttachments: {
    attachmentId: string;
    fileName: string;
    fileType: string;
    uploadedAt: string;
  }[];
}

/** Medication row inside a visit — numeric id, no visitId/createdAt. */
export interface MedicationDto {
  id: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

/** Attachment metadata — view via fileUrl (direct Cloudinary link). */
export interface AttachmentMetaDto {
  id: string;
  /** Present on GET /attachments/{id}; omitted in the upload response. */
  visitId?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  /** Present on GET /attachments/{id}; omitted in the upload response. */
  uploadedBy?: number;
  uploadedAt: string;
}

/** GET/POST/PUT/PATCH /visits — the full encounter. */
export interface VisitDetailDto {
  id: string;
  patientId: number;
  patientFullName: string;
  patientNationalId: string;
  doctorId: number;
  doctorFullName: string;
  visitDate: string;
  visitType: VisitType;
  status: VisitStatus;
  notes: string | null;
  diagnosis: string | null;
  requiredTests: string | null;
  createdAt: string;
  medications: MedicationDto[];
  attachments: AttachmentMetaDto[];
}

export interface MedicationRowInput {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

/** POST /visits — visitDate accepted as `YYYY-MM-DD`, medications optional inline. */
export interface CreateVisitInput {
  patientId: number;
  doctorId: number;
  visitDate: string;
  visitType: VisitType;
  diagnosis?: string;
  notes?: string;
  requiredTests?: string;
  medications: MedicationRowInput[];
}

/** PUT /visits/{id} — full replace of the clinical narrative. */
export interface UpdateVisitInput {
  diagnosis: string;
  notes: string;
  requiredTests: string;
}

export interface UpdateVisitStatusInput {
  visitId: string;
  /** Validated against the state machine client-side; backend enforces final say. */
  status: VisitStatus;
}

/** POST /visits/{id}/medications — batch-wrapped body, returns the updated visit. */
export interface AddMedicationsInput {
  visitId: string;
  medications: MedicationRowInput[];
}

export interface UploadAttachmentInput {
  visitId: string;
  file: File;
}
