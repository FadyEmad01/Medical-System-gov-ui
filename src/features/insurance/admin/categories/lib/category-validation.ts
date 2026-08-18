import type { AuthActionError } from "@/features/auth/lib/action-error";
import type { DocumentType } from "../../../enrollment/types";
import type { MaritalStatus } from "../../../types";

export const CODE_MAX = 50;
export const NAME_MAX = 100;
export const DESCRIPTION_MAX = 500;
export const DISPLAY_NAME_MAX = 200;
export const HELP_MAX = 500;
export const URL_MAX = 500;

const DOCUMENT_TYPES: readonly DocumentType[] = [
  "NationalId",
  "BirthCertificate",
  "MarriageCertificate",
  "EmploymentLetter",
  "DisabilityCertificate",
  "DeathCertificate",
  "GuardianAuthorization",
  "FamilyRegistration",
];

/** Single source for the marital-status closed set (UI toggles read it too). */
export const KNOWN_MARITAL_STATUSES: readonly MaritalStatus[] = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
];

function invalid(
  formError: string,
  fieldErrors: Record<string, string> = {},
): {
  ok: false;
  error: AuthActionError;
} {
  return { ok: false, error: { kind: "validation", formError, fieldErrors } };
}

/**
 * Boundary validation for POST/PUT /categories. The code is an identity
 * field — accepted but expected to be unchanged on edit (the UI keeps it
 * read-only there).
 */
export function validateCategoryInput(input: {
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}): { ok: true; data: typeof input } | { ok: false; error: AuthActionError } {
  const code = input.code.trim();
  const name = input.name.trim();
  const description = input.description?.trim() ?? "";

  if (code === "" || code.length > CODE_MAX)
    return invalid("admin.categories.errors.code");
  if (name === "" || name.length > NAME_MAX)
    return invalid("admin.categories.errors.name");
  if (description.length > DESCRIPTION_MAX)
    return invalid("admin.categories.errors.description");
  if (!Number.isInteger(input.displayOrder))
    return invalid("admin.categories.errors.displayOrder");

  return {
    ok: true,
    data: {
      code,
      name,
      description: description === "" ? null : description,
      displayOrder: input.displayOrder,
      isActive: input.isActive,
    },
  };
}

/** PUT eligibility-rule — ages nullable, marital statuses closed set. */
export function validateEligibilityRule(input: {
  minimumAge: number | null;
  maximumAge: number | null;
  allowedMaritalStatuses: string[];
  guardianRequired: boolean;
  dependentsAllowed: boolean;
}):
  | {
      ok: true;
      data: {
        minimumAge: number | null;
        maximumAge: number | null;
        allowedMaritalStatuses: MaritalStatus[];
        guardianRequired: boolean;
        dependentsAllowed: boolean;
      };
    }
  | { ok: false; error: AuthActionError } {
  const { minimumAge, maximumAge } = input;
  if (
    (minimumAge != null && (!Number.isInteger(minimumAge) || minimumAge < 0)) ||
    (maximumAge != null && (!Number.isInteger(maximumAge) || maximumAge < 0))
  ) {
    return invalid("admin.categories.errors.age");
  }
  if (minimumAge != null && maximumAge != null && minimumAge > maximumAge) {
    return invalid("admin.categories.errors.ageRange");
  }
  if (
    !input.allowedMaritalStatuses.every((status) =>
      KNOWN_MARITAL_STATUSES.includes(status as MaritalStatus),
    )
  ) {
    return invalid("admin.categories.errors.maritalStatuses");
  }

  return {
    ok: true,
    data: {
      minimumAge,
      maximumAge,
      allowedMaritalStatuses: input.allowedMaritalStatuses as MaritalStatus[],
      guardianRequired: input.guardianRequired,
      dependentsAllowed: input.dependentsAllowed,
    },
  };
}

/** Shared field checks for add/update requirement rows. */
export function validateRequirementFields(input: {
  displayName: string | null;
  helpText: string | null;
  sampleDocumentUrl: string | null;
}): { ok: true } | { ok: false; error: AuthActionError } {
  if ((input.displayName?.length ?? 0) > DISPLAY_NAME_MAX)
    return invalid("admin.categories.errors.displayName");
  if ((input.helpText?.length ?? 0) > HELP_MAX)
    return invalid("admin.categories.errors.helpText");
  const url = input.sampleDocumentUrl?.trim() ?? "";
  if (url.length > URL_MAX) return invalid("admin.categories.errors.url");
  if (url !== "" && !/^https?:\/\//.test(url))
    return invalid("admin.categories.errors.url");
  return { ok: true };
}

export function isKnownDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.includes(value as DocumentType);
}

/** PUT /categories/{id}/requirements — full replace of the document-type set. */
export function validateDocumentTypes(
  input: string[],
): { ok: true; data: DocumentType[] } | { ok: false; error: AuthActionError } {
  const unique = [...new Set(input)];
  if (!unique.every((value) => isKnownDocumentType(value))) {
    return invalid("admin.categories.errors.documentType");
  }
  return { ok: true, data: unique };
}

export const KNOWN_DOCUMENT_TYPES = DOCUMENT_TYPES;
