"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { UploadSlotState } from "../components/wizard/upload-slot";
import { findCurrentDocument } from "../lib/document-current";
import { validateDocumentFile } from "../lib/file-validation";
import type { CategoryDocumentRequirementDto } from "../types";
import {
  DOCUMENTS_QUERY_KEY,
  useDocuments,
  useUploadDocument,
} from "./use-enrollment";

export type DocumentSlotOptionalValues = {
  documentNumber?: string;
  expiresAt?: string;
};

/**
 * Shared slot-machine state for required-document uploads.
 *
 * Owns uploading/processing/error UI state, inline error text, local "removed"
 * overrides, and optional metadata that travels with the next upload. Used by
 * both the wizard documents step and the tracking "waiting for documents"
 * section so those surfaces stay behaviorally identical.
 */
export function useDocumentSlots({
  patientId,
  requirements,
}: {
  patientId: number;
  requirements: CategoryDocumentRequirementDto[];
}) {
  const queryClient = useQueryClient();
  const documentsQuery = useDocuments(patientId);
  const upload = useUploadDocument();

  const [slotStates, setSlotStates] = useState<Record<string, UploadSlotState>>(
    {},
  );
  const [slotErrors, setSlotErrors] = useState<Record<string, string | null>>(
    {},
  );
  const [removedOverrides, setRemovedOverrides] = useState<
    Record<string, boolean>
  >({});
  const [optionalValues, setOptionalValues] = useState<
    Record<string, DocumentSlotOptionalValues>
  >({});

  const documents = documentsQuery.data ?? [];

  // A slot left in "processing" settles once the documents list refreshes
  // after a successful upload — the server now owns the file.
  useEffect(() => {
    setSlotStates((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const requirement of requirements) {
        if (next[requirement.id]?.kind !== "processing") continue;
        if (!findCurrentDocument(documents, requirement.documentType)) continue;
        next[requirement.id] = { kind: "idle" };
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [documents, requirements]);

  const handleUpload = (
    requirement: CategoryDocumentRequirementDto,
    file: File,
  ) => {
    const validation = validateDocumentFile(file);
    if (!validation.ok) {
      setSlotStates((prev) => ({
        ...prev,
        [requirement.id]: { kind: "error" },
      }));
      setSlotErrors((prev) => ({
        ...prev,
        [requirement.id]: validation.errorKey,
      }));
      return;
    }

    setSlotStates((prev) => ({
      ...prev,
      [requirement.id]: { kind: "uploading" },
    }));
    setSlotErrors((prev) => ({ ...prev, [requirement.id]: null }));

    upload.mutate(
      {
        documentType: requirement.documentType,
        file,
        ...(optionalValues[requirement.id] ?? {}),
      },
      {
        onSuccess: () => {
          setSlotStates((prev) => ({
            ...prev,
            [requirement.id]: { kind: "processing" },
          }));
          setRemovedOverrides((prev) => ({
            ...prev,
            [requirement.id]: false,
          }));
        },
        onError: (error) => {
          // Validation and storage errors render inside the slot; the hook
          // toasts session/permission/other failures instead.
          const inline = error.kind === "validation" || error.kind === "server";
          setSlotStates((prev) => ({
            ...prev,
            [requirement.id]: inline ? { kind: "error" } : { kind: "idle" },
          }));
          setSlotErrors((prev) => ({
            ...prev,
            [requirement.id]: inline ? (error.formError ?? null) : null,
          }));
        },
      },
    );
  };

  const handleRemove = (requirement: CategoryDocumentRequirementDto) => {
    setRemovedOverrides((prev) => ({ ...prev, [requirement.id]: true }));
    // Ask the server to re-confirm; the visual override keeps the slot idle
    // until the patient picks a replacement.
    queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY(patientId) });
  };

  return {
    documentsQuery,
    documents,
    slotStates,
    slotErrors,
    removedOverrides,
    optionalValues,
    setOptionalValues,
    handleUpload,
    handleRemove,
  };
}
