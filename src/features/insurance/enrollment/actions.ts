"use server";

import type {
  ActionResult,
  AuthActionError,
} from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import { ApiError } from "@/lib/api-client";
import {
  cancelApplication,
  getApplicationDetail,
} from "../api/applications-client";
import {
  addDependent,
  endDependent,
  getDependents,
} from "../api/dependents-client";
import { getDocuments, uploadDocument } from "../api/documents-client";
import {
  getCategories,
  getCurrentEnrollment,
  getReadiness,
  getSummary,
  startEnrollment,
  submitEnrollment,
} from "../api/enrollment-client";
import { getInsuranceStatus } from "../api/status-client";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../lib/session-aware-error";
import type { Gender, InsuranceStatusResponseDto } from "../types";
import { validateDocumentFile } from "./lib/file-validation";
import type {
  AddDependentRequestDto,
  ApplicationDetailResponseDto,
  ApplicationResponseDto,
  CitizenDocumentResponseDto,
  DependentResponseDto,
  DocumentType,
  EnrollmentReadinessResponseDto,
  EnrollmentResponseDto,
  EnrollmentSummaryResponseDto,
  InsuranceCategoryResponseDto,
  RelationshipType,
  UploadDocumentInput,
} from "./types";

/**
 * Server actions for the insurance enrollment wizard.
 *
 * Every action is a thin, boundary-validating wrapper around an api client:
 * it reads the session token from the auth cookie, validates untrusted client
 * input, and normalizes errors into `AuthActionError` values so hooks can map
 * them to messages. Only async functions may be exported from a 'use server'
 * module — error types and helpers stay private here.
 */

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

const GENDER_VALUES: readonly Gender[] = ["Male", "Female"];

const RELATIONSHIP_TYPE_VALUES: readonly RelationshipType[] = [
  "Spouse",
  "Child",
  "Parent",
  "Guardian",
];

function optionalTrimmed(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

/**
 * Validates the upload boundary: a known document type, a file that passes
 * the shared size/type rules, and optional fields trimmed or omitted.
 */
function parseUploadDocumentInput(
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

/**
 * Validates the dependent boundary: four required name parts, known enum
 * values, a parseable date, and a 14-digit national ID when provided.
 */
function parseAddDependentInput(
  input: AddDependentRequestDto,
):
  | { ok: true; data: AddDependentRequestDto }
  | { ok: false; error: AuthActionError } {
  const firstName = input.firstName.trim();
  const secondName = input.secondName.trim();
  const thirdName = input.thirdName.trim();
  const fourthName = input.fourthName.trim();

  if (
    firstName === "" ||
    secondName === "" ||
    thirdName === "" ||
    fourthName === "" ||
    firstName.length > 50 ||
    secondName.length > 50 ||
    thirdName.length > 50 ||
    fourthName.length > 50
  ) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "dependents.errors.invalidName",
        fieldErrors: {},
      },
    };
  }

  if (!GENDER_VALUES.includes(input.gender)) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "dependents.errors.genderRequired",
        fieldErrors: {},
      },
    };
  }

  if (!RELATIONSHIP_TYPE_VALUES.includes(input.relationshipType)) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "dependents.errors.relationshipRequired",
        fieldErrors: {},
      },
    };
  }

  if (!isIsoDate(input.dateOfBirth)) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "dependents.errors.dateOfBirthRequired",
        fieldErrors: {},
      },
    };
  }

  const nationalId = input.nationalId?.trim() ?? "";
  if (nationalId !== "" && !/^\d{14}$/.test(nationalId)) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "errors.validationFailed",
        fieldErrors: { nationalId: "dependents.errors.nationalId" },
      },
    };
  }

  return {
    ok: true,
    data: {
      firstName,
      secondName,
      thirdName,
      fourthName,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      relationshipType: input.relationshipType,
      ...(nationalId !== "" ? { nationalId } : {}),
    },
  };
}

/** GET /insurance/categories — the landing page's category list. */
export async function getCategoriesAction(): Promise<
  ActionResult<InsuranceCategoryResponseDto[]>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const categories = await getCategories(token);
    return { ok: true, data: categories };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/**
 * GET /insurance/enrollment/current — null when the patient has none. A 404
 * here is the normal "no active enrollment" case, not an error.
 */
export async function getCurrentEnrollmentAction(): Promise<
  ActionResult<EnrollmentResponseDto | null>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const enrollment = await getCurrentEnrollment(token);
    return { ok: true, data: enrollment };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: null };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** POST /insurance/enrollment/start — begins enrollment for a category. */
export async function startEnrollmentAction(
  insuranceCategoryId: InsuranceCategoryResponseDto["id"],
): Promise<ActionResult<EnrollmentResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  // Trim the untrusted client boundary value so a whitespace-padded id is
  // never POSTed verbatim to the API.
  const categoryId = insuranceCategoryId.trim();

  try {
    const enrollment = await startEnrollment(token, categoryId);
    return { ok: true, data: enrollment };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/**
 * GET /insurance/enrollment/readiness — gates the wizard's Submit step. A 404
 * here is the normal "no enrollment yet" case, not an error.
 */
export async function getReadinessAction(): Promise<
  ActionResult<EnrollmentReadinessResponseDto | null>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const readiness = await getReadiness(token);
    return { ok: true, data: readiness };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: null };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /insurance/enrollment/summary — the review step's snapshot. */
export async function getSummaryAction(): Promise<
  ActionResult<EnrollmentSummaryResponseDto>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const summary = await getSummary(token);
    return { ok: true, data: summary };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/**
 * GET /insurance/documents/{patientId} — empty when the patient has none. A
 * 404 is the normal "no documents yet" case, not an error.
 */
export async function getDocumentsAction(
  patientId: number,
): Promise<ActionResult<CitizenDocumentResponseDto[]>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const documents = await getDocuments(patientId, token);
    return { ok: true, data: documents };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: [] };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** POST /insurance/documents/upload — re-uploading supersedes the old file. */
export async function uploadDocumentAction(
  input: UploadDocumentInput,
): Promise<ActionResult<CitizenDocumentResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const parsed = parseUploadDocumentInput(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const document = await uploadDocument(token, parsed.data);
    return { ok: true, data: document };
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.kind === "server" &&
      err.status === 502
    ) {
      return {
        ok: false,
        error: {
          kind: "server",
          formError: "documents.errors.storageUnavailable",
          fieldErrors: {},
        },
      };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /insurance/dependents/{patientId} — empty when the patient has none. */
export async function getDependentsAction(
  patientId: number,
): Promise<ActionResult<DependentResponseDto[]>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const dependents = await getDependents(patientId, token);
    return { ok: true, data: dependents };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** POST /insurance/dependents — adds a dependent to the patient. */
export async function addDependentAction(
  input: AddDependentRequestDto,
): Promise<ActionResult<DependentResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const parsed = parseAddDependentInput(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const dependent = await addDependent(token, parsed.data);
    return { ok: true, data: dependent };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** PATCH /insurance/dependents/{relationshipId}/end — removes a dependent. */
export async function endDependentAction(
  relationshipId: string,
): Promise<ActionResult<DependentResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const dependent = await endDependent(token, relationshipId);
    return { ok: true, data: dependent };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** PATCH /insurance/enrollment/submit — moves the draft into review. */
export async function submitEnrollmentAction(): Promise<
  ActionResult<ApplicationResponseDto>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const application = await submitEnrollment(token);
    return { ok: true, data: application };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/**
 * GET /insurance/status/{patientId} — null when the patient has no
 * application yet. A 404 here is the normal "nothing to track" case, not an
 * error.
 */
export async function getStatusAction(
  patientId: number,
): Promise<ActionResult<InsuranceStatusResponseDto | null>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const status = await getInsuranceStatus(patientId, token);
    return { ok: true, data: status };
  } catch (err) {
    if (err instanceof ApiError && err.kind === "notFound") {
      return { ok: true, data: null };
    }
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /insurance/applications/detail/{applicationId}. */
export async function getApplicationDetailAction(
  applicationId: string,
): Promise<ActionResult<ApplicationDetailResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const detail = await getApplicationDetail(token, applicationId);
    return { ok: true, data: detail };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** PATCH /insurance/applications/{applicationId}/cancel. */
export async function cancelApplicationAction(
  applicationId: string,
): Promise<ActionResult<ApplicationResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const application = await cancelApplication(token, applicationId);
    return { ok: true, data: application };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}
