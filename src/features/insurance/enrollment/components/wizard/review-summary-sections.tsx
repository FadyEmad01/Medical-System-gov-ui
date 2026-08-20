"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { maskNationalId } from "../../lib/dependent-display";
import {
  DOCUMENT_TYPE_ICON,
  DOCUMENT_TYPE_LABEL_KEY,
} from "../../lib/document-type";
import type {
  CitizenDocumentResponseDto,
  DependentResponseDto,
  DocumentType,
} from "../../types";
import {
  dependentName,
  DocumentTypeBadges,
  ReviewSection,
} from "./review-sections";

/** Eligibility verdict + missing-document badges. */
export function EligibilitySection({
  eligible,
  violations,
  missingDocumentTypes,
}: {
  eligible: boolean;
  violations: string[];
  missingDocumentTypes: DocumentType[];
}) {
  const t = useTranslations("insurance");

  return (
    <ReviewSection title={t("review.eligibility")}>
      <div className="flex flex-col gap-2">
        {eligible ? (
          <p className="text-sm text-muted-foreground">
            {t("review.eligibilityOk")}
          </p>
        ) : (
          <ul className="ms-4 flex list-disc flex-col gap-1 text-sm text-muted-foreground">
            {violations.map((violation) => (
              <li key={violation}>{violation}</li>
            ))}
          </ul>
        )}
        <DocumentTypeBadges
          types={missingDocumentTypes}
          label={t("documents.missing")}
        />
      </div>
    </ReviewSection>
  );
}

/** Active dependents list (or empty copy). */
export function DependentsSection({
  dependents,
}: {
  dependents: DependentResponseDto[];
}) {
  const t = useTranslations("insurance");

  return (
    <ReviewSection title={t("review.dependents")}>
      {dependents.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {dependents.map((dependent) => (
            <li
              key={dependent.relationshipId}
              className="flex flex-wrap items-center gap-2 text-sm"
            >
              <span className="font-medium">
                {dependentName(dependent, t)}
              </span>
              <Badge variant="secondary">
                {t(`dependents.relationship.${dependent.relationshipType}`)}
              </Badge>
              {dependent.nationalId ? (
                <span className="text-xs text-muted-foreground">
                  {maskNationalId(dependent.nationalId)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("review.dependentsEmpty")}
        </p>
      )}
    </ReviewSection>
  );
}

/** Current documents list + missing-type badges. */
export function DocumentsSection({
  documents,
  missingDocumentTypes,
}: {
  documents: CitizenDocumentResponseDto[];
  missingDocumentTypes: DocumentType[];
}) {
  const t = useTranslations("insurance");

  return (
    <ReviewSection title={t("review.documents")}>
      <div className="flex flex-col gap-2">
        {documents.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {documents.map((document) => {
              const Icon = DOCUMENT_TYPE_ICON[document.documentType];
              const labelKey = DOCUMENT_TYPE_LABEL_KEY[document.documentType];
              return (
                <li
                  key={document.id}
                  className="flex flex-wrap items-center gap-2 text-sm"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    {t.has(labelKey) ? t(labelKey) : document.documentType}
                  </span>
                  <Badge variant="secondary">{t("documents.current")}</Badge>
                </li>
              );
            })}
          </ul>
        ) : null}
        <DocumentTypeBadges
          types={missingDocumentTypes}
          label={t("documents.missing")}
        />
      </div>
    </ReviewSection>
  );
}
