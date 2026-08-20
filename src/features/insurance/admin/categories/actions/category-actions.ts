"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import type { InsuranceCategoryResponseDto } from "../../../enrollment/types";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../../lib/session-aware-error";
import {
  createCategory,
  getAllCategories,
  getCategory,
  replaceRequirements,
  setEligibilityRule,
  updateCategory,
} from "../api/categories-admin-client";
import { idOf, invalid } from "../lib/action-helpers";
import {
  validateCategoryInput,
  validateDocumentTypes,
  validateEligibilityRule,
} from "../lib/category-validation";

/** Server actions for Admin category configuration (phases 3). */

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
