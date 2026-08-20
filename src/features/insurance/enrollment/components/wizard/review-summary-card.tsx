"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatIsoDate } from "../../lib/format-iso-date";
import type { EnrollmentSummaryResponseDto } from "../../types";
import {
  ProfileSummary,
  ReviewDetail,
  ReviewSection,
} from "./review-sections";
import {
  DependentsSection,
  DocumentsSection,
  EligibilitySection,
} from "./review-summary-sections";

/** Full enrollment review Card: application meta + category / profile / eligibility / dependents / documents / warnings. */
export function ReviewSummaryCard({
  summary,
  applicationCreatedAt,
}: {
  summary: EnrollmentSummaryResponseDto;
  applicationCreatedAt: string;
}) {
  const t = useTranslations("insurance");
  const locale = useLocale();

  const currentDocuments = summary.documents.filter(
    (document) => document.isCurrent,
  );
  const activeDependents = summary.dependents.filter(
    (dependent) => dependent.isActive,
  );
  const missingDocumentTypes = summary.missingDocumentTypes;
  const eligible =
    summary.readiness.isEligibleForCategory &&
    summary.readiness.eligibilityViolations.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("review.title")}</CardTitle>
        <CardDescription>{t("review.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <ReviewDetail
            label={t("review.applicationNumber")}
            value={summary.applicationNumber}
          />
          <ReviewDetail
            label={t("review.applicationStatus")}
            value={t(`enrollment.status.${summary.applicationStatus}`)}
          />
          <ReviewDetail
            label={t("review.createdAt")}
            value={formatIsoDate(applicationCreatedAt, locale)}
          />
        </dl>

        <ReviewSection title={t("review.category")}>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              {summary.insuranceCategory.name}
            </p>
            {summary.insuranceCategory.description ? (
              <p className="text-sm text-muted-foreground">
                {summary.insuranceCategory.description}
              </p>
            ) : null}
            {summary.insuranceCategory.dependentsAllowed === false ? (
              <p className="text-xs text-muted-foreground">
                {t("categories.dependentsNotAllowed")}
              </p>
            ) : null}
            {summary.insuranceCategory.guardianRequired ? (
              <p className="text-xs text-muted-foreground">
                {t("categories.guardianRequired")}
              </p>
            ) : null}
          </div>
        </ReviewSection>

        <ReviewSection title={t("review.profile")}>
          <ProfileSummary profile={summary.profile} />
        </ReviewSection>

        <EligibilitySection
          eligible={eligible}
          violations={summary.readiness.eligibilityViolations}
          missingDocumentTypes={missingDocumentTypes}
        />

        <DependentsSection dependents={activeDependents} />

        <DocumentsSection
          documents={currentDocuments}
          missingDocumentTypes={missingDocumentTypes}
        />

        {summary.warnings.length > 0 ? (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">
              {t("review.warnings")}
            </p>
            <ul className="list-disc ps-4 text-sm text-muted-foreground">
              {summary.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
