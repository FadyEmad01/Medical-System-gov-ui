"use server";

import type {
  ActionResult,
  AuthActionError,
} from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import type {
  CategoryDocumentRequirementDto,
  InsuranceCategoryResponseDto,
} from "../../enrollment/types";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../lib/session-aware-error";
import {
  addRequirement,
  createCategory,
  deleteRequirement,
  getAllCategories,
  getCategory,
  getRequirements,
  replaceRequirements,
  setEligibilityRule,
  updateCategory,
  updateRequirement,
} from "./api/categories-admin-client";
import {
  isKnownDocumentType,
  validateCategoryInput,
  validateDocumentTypes,
  validateEligibilityRule,
  validateRequirementFields,
} from "./lib/category-validation";
import type {
  AddCategoryDocumentRequirementRequestDto,
  UpdateCategoryDocumentRequirementRequestDto,
} from "./types";

/** Server actions for Admin category configuration (phases 3). */

function invalid(formError: string): { ok: false; error: AuthActionError } {
  return {
    ok: false,
    error: { kind: "validation", formError, fieldErrors: {} },
  };
}

function idOf(value: string): string {
  return value.trim();
}

/** GET /categories/{id} — one category, including inactive. */
export async function getCategoryAction(
  categoryId: string,
): Promise<ActionResult<InsuranceCategoryResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const id = idOf(categoryId);
  if (id === "") return invalid("admin.categories.errors.invalidId");

  try {
    const category = await getCategory(token, id);
    return { ok: true, data: category };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /categories/all — every category incl. inactive. */
export async function getAllCategoriesAction(): Promise<
  ActionResult<InsuranceCategoryResponseDto[]>
> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  try {
    const categories = await getAllCategories(token);
    return { ok: true, data: categories };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

export async function createCategoryAction(
  input: Parameters<typeof validateCategoryInput>[0],
): Promise<ActionResult<InsuranceCategoryResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const parsed = validateCategoryInput(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const category = await createCategory(token, parsed.data);
    return { ok: true, data: category };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

export async function updateCategoryAction(
  categoryId: string,
  input: Parameters<typeof validateCategoryInput>[0],
): Promise<ActionResult<InsuranceCategoryResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const id = idOf(categoryId);
  if (id === "") return invalid("admin.categories.errors.invalidId");

  const parsed = validateCategoryInput(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const category = await updateCategory(token, id, parsed.data);
    return { ok: true, data: category };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

export async function setEligibilityRuleAction(
  categoryId: string,
  input: Parameters<typeof validateEligibilityRule>[0],
): Promise<ActionResult<InsuranceCategoryResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const id = idOf(categoryId);
  if (id === "") return invalid("admin.categories.errors.invalidId");

  const parsed = validateEligibilityRule(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const category = await setEligibilityRule(token, id, parsed.data);
    return { ok: true, data: category };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** PUT /categories/{id}/requirements — full replace of the document-type set. */
export async function replaceRequirementsAction(
  categoryId: string,
  documentTypes: string[],
): Promise<ActionResult<InsuranceCategoryResponseDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const id = idOf(categoryId);
  if (id === "") return invalid("admin.categories.errors.invalidId");

  const parsed = validateDocumentTypes(documentTypes);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const category = await replaceRequirements(token, id, {
      documentTypes: parsed.data,
    });
    return { ok: true, data: category };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

/** GET /categories/{id}/requirements — all rows incl. inactive. */
export async function getRequirementsAction(
  categoryId: string,
): Promise<ActionResult<CategoryDocumentRequirementDto[]>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const id = idOf(categoryId);
  if (id === "") return invalid("admin.categories.errors.invalidId");

  try {
    const requirements = await getRequirements(token, id);
    return { ok: true, data: requirements };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

export async function addRequirementAction(
  categoryId: string,
  input: {
    documentType: string;
    displayName: string | null;
    helpText: string | null;
    sampleDocumentUrl: string | null;
    displayOrder: number;
    isMandatory: boolean;
  },
): Promise<ActionResult<CategoryDocumentRequirementDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const id = idOf(categoryId);
  if (id === "") return invalid("admin.categories.errors.invalidId");
  if (!isKnownDocumentType(input.documentType))
    return invalid("admin.categories.errors.documentType");

  const fields = validateRequirementFields(input);
  if (!fields.ok) return { ok: false, error: fields.error };

  const body: AddCategoryDocumentRequirementRequestDto = {
    documentType: input.documentType,
    displayName: input.displayName?.trim() || null,
    helpText: input.helpText?.trim() || null,
    sampleDocumentUrl: input.sampleDocumentUrl?.trim() || null,
    displayOrder: input.displayOrder,
    isMandatory: input.isMandatory,
  };

  try {
    const requirement = await addRequirement(token, id, body);
    return { ok: true, data: requirement };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

export async function updateRequirementAction(
  categoryId: string,
  requirementId: string,
  input: {
    displayName: string | null;
    helpText: string | null;
    sampleDocumentUrl: string | null;
    displayOrder: number;
    isActive: boolean;
    isMandatory: boolean;
  },
): Promise<ActionResult<CategoryDocumentRequirementDto>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const cid = idOf(categoryId);
  const rid = idOf(requirementId);
  if (cid === "" || rid === "")
    return invalid("admin.categories.errors.invalidId");

  const fields = validateRequirementFields(input);
  if (!fields.ok) return { ok: false, error: fields.error };

  const body: UpdateCategoryDocumentRequirementRequestDto = {
    displayName: input.displayName?.trim() || null,
    helpText: input.helpText?.trim() || null,
    sampleDocumentUrl: input.sampleDocumentUrl?.trim() || null,
    displayOrder: input.displayOrder,
    isActive: input.isActive,
    isMandatory: input.isMandatory,
  };

  try {
    const requirement = await updateRequirement(token, cid, rid, body);
    return { ok: true, data: requirement };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}

export async function deleteRequirementAction(
  categoryId: string,
  requirementId: string,
): Promise<ActionResult<null>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const cid = idOf(categoryId);
  const rid = idOf(requirementId);
  if (cid === "" || rid === "")
    return invalid("admin.categories.errors.invalidId");

  try {
    await deleteRequirement(token, cid, rid);
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: await toSessionAwareError(err) };
  }
}
