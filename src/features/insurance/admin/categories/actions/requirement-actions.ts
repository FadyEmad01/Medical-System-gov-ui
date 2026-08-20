"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import type { CategoryDocumentRequirementDto } from "../../../enrollment/types";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../../lib/session-aware-error";
import {
  addRequirement,
  deleteRequirement,
  getRequirements,
  updateRequirement,
} from "../api/categories-admin-client";
import { idOf, invalid } from "../lib/action-helpers";
import {
  isKnownDocumentType,
  validateRequirementFields,
} from "../lib/category-validation";
import type {
  AddCategoryDocumentRequirementRequestDto,
  UpdateCategoryDocumentRequirementRequestDto,
} from "../types";

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
