"use server";

import type { ActionResult } from "@/features/auth/lib/action-error";
import { getSessionToken } from "@/features/auth/lib/session-cookie";
import { ApiError } from "@/lib/api-client";
import { getDocuments, uploadDocument } from "../../api/documents-client";
import {
  SESSION_EXPIRED_ERROR,
  toSessionAwareError,
} from "../../lib/session-aware-error";
import { parseUploadDocumentInput } from "../lib/parse-upload-document";
import type { CitizenDocumentResponseDto, UploadDocumentInput } from "../types";

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
