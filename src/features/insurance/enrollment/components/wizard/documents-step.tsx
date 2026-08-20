"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useDocumentSlots } from "../../hooks/use-document-slots";
import { useCurrentEnrollment } from "../../hooks/use-enrollment";
import { findCurrentDocument } from "../../lib/document-current";
import { DOCUMENT_TYPE_ORDER } from "../../lib/document-type";
import { OptionalDocumentFields } from "../shared/optional-document-fields";
import { UploadSlot } from "./upload-slot";

/**
 * Step 3 — documents. One slot per active requirement of the chosen category.
 *
 * Slot-level UI state (uploading/processing/error, inline error text, "removed"
 * overrides, optional metadata) lives in `useDocumentSlots`. Removing a
 * document is a local visual override — the slot falls back to idle until the
 * patient picks a replacement. Optional document metadata (number/expiry)
 * travels with the next upload for that slot.
 */
export function DocumentsStep({ patientId }: { patientId: number }) {
  const t = useTranslations("insurance");
  const enrollmentQuery = useCurrentEnrollment();

  /**
   * Active requirements in display order. When the category declares document
   * types without full requirement rows (or none are active), synthesize slots
   * so the patient can still upload every needed file. The synthetic slot id
   * is the document type itself, keeping the slot-state keying stable.
   */
  const requirements = useMemo(() => {
    const category = enrollmentQuery.data?.insuranceCategory;
    const requirements = (category?.documentRequirements ?? [])
      .filter((requirement) => requirement.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    if (requirements.length > 0) return requirements;
    return (category?.requiredDocumentTypes ?? []).map((documentType) => ({
      id: documentType,
      documentType,
      displayName: documentType,
      helpText: null,
      sampleDocumentUrl: null,
      displayOrder: DOCUMENT_TYPE_ORDER.indexOf(documentType),
      isActive: true,
      isMandatory: true,
    }));
  }, [enrollmentQuery.data]);

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
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t("documents.description")}
      </p>

      {documentsQuery.isLoading ? (
        <div className="flex min-h-32 items-center justify-center">
          <Spinner />
        </div>
      ) : requirements.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("documents.empty")}</p>
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
    </div>
  );
}
