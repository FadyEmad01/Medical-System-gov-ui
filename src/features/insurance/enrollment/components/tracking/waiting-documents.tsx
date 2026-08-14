"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  DOCUMENTS_QUERY_KEY,
  useDocuments,
  useUploadDocument,
} from "../../hooks/use-enrollment";
import { findCurrentDocument } from "../../lib/document-current";
import { validateDocumentFile } from "../../lib/file-validation";
import type { CategoryDocumentRequirementDto } from "../../types";
import { UploadSlot, type UploadSlotState } from "../wizard/upload-slot";

type OptionalValues = {
  documentNumber?: string;
  expiresAt?: string;
};

/**
 * The tracking page's "waiting for documents" upload section.
 *
 * Mirrors the wizard's documents step slot machine (same slot states, inline
 * error text, removed overrides, optional metadata) while reusing the
 * presentational `UploadSlot`. Uploading here never changes the application
 * status, so nothing is gated on upload success — the patient simply supplies
 * what the reviewer asked for and the application stays in
 * WaitingForDocuments until a reviewer acts.
 */
export function WaitingDocumentsSection({
  patientId,
  requirements,
}: {
  patientId: number;
  requirements: CategoryDocumentRequirementDto[];
}) {
  const t = useTranslations("insurance");
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
    Record<string, OptionalValues>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tracking.documentsSection")}</CardTitle>
      </CardHeader>
      <CardContent>
        {documentsQuery.isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requirements.map((requirement) => {
              const removed = removedOverrides[requirement.id] === true;
              const current = removed
                ? null
                : findCurrentDocument(documents, requirement.documentType);
              const state = slotStates[requirement.id] ?? { kind: "idle" };
              const errorText = slotErrors[requirement.id] ?? null;

              return (
                <div key={requirement.id} className="flex flex-col gap-1">
                  <UploadSlot
                    requirement={requirement}
                    current={current}
                    state={state}
                    errorText={errorText}
                    onUpload={(file) => handleUpload(requirement, file)}
                    onRemove={() => handleRemove(requirement)}
                  />
                  {removed ? (
                    <p className="ps-1 text-xs text-muted-foreground">
                      {t("documents.removedHint")}
                    </p>
                  ) : null}
                  {current ? (
                    <OptionalDocumentFields
                      value={optionalValues[requirement.id] ?? {}}
                      onChange={(values) =>
                        setOptionalValues((prev) => ({
                          ...prev,
                          [requirement.id]: values,
                        }))
                      }
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Collapsible optional metadata (document number / expiry) for one slot. */
function OptionalDocumentFields({
  value,
  onChange,
}: {
  value: OptionalValues;
  onChange: (values: OptionalValues) => void;
}) {
  const t = useTranslations("insurance");
  const documentNumberId = useId();
  const expiresAtId = useId();

  return (
    <Collapsible className="ps-4">
      <CollapsibleTrigger asChild>
        <Button variant="link" size="sm" className="px-0">
          <ChevronDownIcon data-icon="inline-start" />
          {t("documents.additionalInfo")}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 py-2">
        <div className="grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={documentNumberId}>
              {t("documents.documentNumber")}
            </FieldLabel>
            <FieldContent>
              <Input
                id={documentNumberId}
                value={value.documentNumber ?? ""}
                onChange={(event) =>
                  onChange({ ...value, documentNumber: event.target.value })
                }
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor={expiresAtId}>
              {t("documents.expiresAt")}
            </FieldLabel>
            <FieldContent>
              <Input
                id={expiresAtId}
                type="date"
                value={value.expiresAt ?? ""}
                onChange={(event) =>
                  onChange({ ...value, expiresAt: event.target.value })
                }
              />
            </FieldContent>
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("documents.additionalInfoHint")}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
