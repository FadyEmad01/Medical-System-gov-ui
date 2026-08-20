"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import {
  addDependent,
  endDependent,
  getDependents,
} from "../../api/dependents-client";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../lib/session-aware-error";
import { parseAddDependentInput } from "../lib/parse-add-dependent";
import type { AddDependentRequestDto, DependentResponseDto } from "../types";

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
