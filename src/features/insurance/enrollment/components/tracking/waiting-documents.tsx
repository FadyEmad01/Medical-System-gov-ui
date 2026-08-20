"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useDocumentSlots } from "../../hooks/use-document-slots";
import { findCurrentDocument } from "../../lib/document-current";
import type { CategoryDocumentRequirementDto } from "../../types";
import { OptionalDocumentFields } from "../shared/optional-document-fields";
import { UploadSlot } from "../wizard/upload-slot";

/**
 * The tracking page's "waiting for documents" upload section.
 *
 * Uses the same `useDocumentSlots` machine as the wizard documents step
 * (slot states, inline error text, removed overrides, optional metadata)
 * while reusing the presentational `UploadSlot`. Uploading here never changes
 * the application status, so nothing is gated on upload success — the patient
 * simply supplies what the reviewer asked for and the application stays in
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
  const {
    documentsQuery,
    documents,
    slotStates,
    slotErrors,
    removedOverrides,
    optionalValues,
    setOptionalValues,
    handleUpload,
    handleRemove,
  } = useDocumentSlots({ patientId, requirements });

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
