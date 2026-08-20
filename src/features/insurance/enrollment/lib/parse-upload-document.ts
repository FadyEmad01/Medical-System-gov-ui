import type { AuthActionError } from "@/features/auth/lib/action-error";
import type { DocumentType, UploadDocumentInput } from "../types";
import { validateDocumentFile } from "./file-validation";

const DOCUMENT_TYPE_VALUES: readonly DocumentType[] = [
  "NationalId",
  "BirthCertificate",
  "MarriageCertificate",
  "EmploymentLetter",
  "DisabilityCertificate",
  "DeathCertificate",
  "GuardianAuthorization",
  "FamilyRegistration",
];

function optionalTrimmed(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Validates the upload boundary: a known document type, a file that passes
 * the shared size/type rules, and optional fields trimmed or omitted.
 */
export function parseUploadDocumentInput(
  input: UploadDocumentInput,
):
  | { ok: true; data: UploadDocumentInput }
  | { ok: false; error: AuthActionError } {
  if (!DOCUMENT_TYPE_VALUES.includes(input.documentType)) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "documents.errors.invalidType",
        fieldErrors: {},
      },
    };
  }

  const fileValidation = validateDocumentFile(input.file);
  if (!fileValidation.ok) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: fileValidation.errorKey,
        fieldErrors: {},
      },
    };
  }

  return {
    ok: true,
    data: {
      documentType: input.documentType,
      file: input.file,
      documentNumber: optionalTrimmed(input.documentNumber),
      expiresAt: optionalTrimmed(input.expiresAt),
      dependentPersonId: optionalTrimmed(input.dependentPersonId),
    },
  };
}
