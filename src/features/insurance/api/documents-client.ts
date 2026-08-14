import "server-only";

import { apiClient } from "@/lib/api-client";
import type {
  CitizenDocumentResponseDto,
  DocumentType,
} from "../enrollment/types";

/** GET /insurance/documents/{patientId} — the patient's documents, newest first. */
export function getDocuments(
  patientId: number,
  token: string,
): Promise<CitizenDocumentResponseDto[]> {
  return apiClient.get<CitizenDocumentResponseDto[]>(
    `/insurance/documents/${patientId}`,
    { token },
  );
}

/**
 * POST /insurance/documents/upload — multipart form.
 *
 * `patientId` is never a form field (it comes from the JWT); a re-upload
 * supersedes the previous file for the same document type.
 */
export function uploadDocument(
  token: string,
  input: {
    documentType: DocumentType;
    file: File;
    documentNumber?: string;
    expiresAt?: string;
    dependentPersonId?: string;
  },
): Promise<CitizenDocumentResponseDto> {
  const formData = new FormData();
  formData.append("documentType", input.documentType);
  formData.append("file", input.file);
  if (input.documentNumber)
    formData.append("documentNumber", input.documentNumber);
  if (input.expiresAt) formData.append("expiresAt", input.expiresAt);
  if (input.dependentPersonId) {
    formData.append("dependentPersonId", input.dependentPersonId);
  }
  return apiClient.post<CitizenDocumentResponseDto>(
    "/insurance/documents/upload",
    formData,
    { token },
  );
}
