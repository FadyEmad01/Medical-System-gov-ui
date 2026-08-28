import "server-only";

import { apiClient } from "@/lib/api-client";
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
 * Clinical workspace API client — captured from the LIVE staging API
 * (2026-08-28). The checked-in doctor-swagger.json is stale; the discovery
 * record with request/response shapes lives in
 * docs/backend-gaps-doctor-clinical.md.
 */

/** GET /patients/search?nationalId= — Doctor/Admin, exact 14-digit match. */
export function searchPatient(
  token: string,
  nationalId: string,
): Promise<PatientSummaryDto> {
  return apiClient.get<PatientSummaryDto>(
    `/patients/search?nationalId=${encodeURIComponent(nationalId)}`,
    { token },
  );
}

/** GET /doctors/{doctorId}/patients — Doctor(own)/Admin roster. */
export function getDoctorPatients(
  token: string,
  doctorId: number,
): Promise<RosterEntryDto[]> {
  return apiClient.get<RosterEntryDto[]>(`/doctors/${doctorId}/patients`, {
    token,
  });
}

/** GET /patients/{patientId}/medical-summary — ownership-checked. */
export function getMedicalSummary(
  token: string,
  patientId: number,
): Promise<MedicalSummaryDto> {
  return apiClient.get<MedicalSummaryDto>(
    `/patients/${patientId}/medical-summary`,
    { token },
  );
}

/** GET /patients/{patientId}/visit-history — full chronological. */
export function getVisitHistory(
  token: string,
  patientId: number,
): Promise<VisitSummaryDto[]> {
  return apiClient.get<VisitSummaryDto[]>(
    `/patients/${patientId}/visit-history`,
    { token },
  );
}

/** GET /visits/{id} — ownership-checked. */
export function getVisit(
  token: string,
  visitId: string,
): Promise<VisitDetailDto> {
  return apiClient.get<VisitDetailDto>(`/visits/${visitId}`, { token });
}

/** POST /visits — Doctor/Admin, optional inline medications. */
export function createVisit(
  token: string,
  input: CreateVisitInput,
): Promise<VisitDetailDto> {
  return apiClient.post<VisitDetailDto>(
    "/visits",
    serializeCreateVisit(input),
    {
      token,
    },
  );
}

/** PUT /visits/{id} — owner only, full replace of the clinical narrative. */
export function updateVisit(
  token: string,
  visitId: string,
  input: UpdateVisitInput,
): Promise<VisitDetailDto> {
  return apiClient.put<VisitDetailDto>(
    `/visits/${visitId}`,
    serializeClinicalNote(input),
    { token },
  );
}

/** PATCH /visits/{id}/status — Doctor/Admin, state machine enforced server-side. */
export function updateVisitStatus(
  token: string,
  input: UpdateVisitStatusInput,
): Promise<VisitDetailDto> {
  return apiClient.patch<VisitDetailDto>(
    `/visits/${input.visitId}/status`,
    { status: input.status },
    { token },
  );
}

/** POST /visits/{id}/medications — batch-wrapped body, owner, open visit (409 when closed); returns the updated visit. */
export function addMedications(
  token: string,
  input: AddMedicationsInput,
): Promise<VisitDetailDto> {
  const { visitId, medications } = input;
  return apiClient.post<VisitDetailDto>(
    `/visits/${visitId}/medications`,
    { medications },
    { token },
  );
}

/** GET /visits/{visitId}/attachments — ownership-checked. */
export function listAttachments(
  token: string,
  visitId: string,
): Promise<AttachmentMetaDto[]> {
  return apiClient.get<AttachmentMetaDto[]>(`/visits/${visitId}/attachments`, {
    token,
  });
}

/** POST /visits/{visitId}/attachments — multipart field `file`, pdf/jpg/png ≤10MB, owner; returns the new attachment (201). */
export function uploadAttachment(
  token: string,
  input: UploadAttachmentInput,
): Promise<AttachmentMetaDto> {
  const formData = new FormData();
  formData.append("file", input.file);
  return apiClient.post<AttachmentMetaDto>(
    `/visits/${input.visitId}/attachments`,
    formData,
    { token },
  );
}

function serializeCreateVisit(input: CreateVisitInput) {
  return {
    patientId: input.patientId,
    doctorId: input.doctorId,
    visitDate: input.visitDate,
    visitType: input.visitType,
    ...(input.diagnosis?.trim() ? { diagnosis: input.diagnosis.trim() } : {}),
    ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
    ...(input.requiredTests?.trim()
      ? { requiredTests: input.requiredTests.trim() }
      : {}),
    ...(input.medications.length > 0 ? { medications: input.medications } : {}),
  };
}

function serializeClinicalNote(input: UpdateVisitInput) {
  return {
    diagnosis: input.diagnosis.trim(),
    notes: input.notes.trim(),
    requiredTests: input.requiredTests.trim(),
  };
}
