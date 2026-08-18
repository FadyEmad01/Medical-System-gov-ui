"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CitizenDocumentResponseDto } from "../../../../enrollment/types";
import type { ApplicationReviewDetailResponseDto } from "../../types";

function useFormatDate() {
  const locale = useLocale();
  return (iso: string | null) => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
  };
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value?.trim() || "—"}</dd>
    </div>
  );
}

/** Applicant identity — the fields an admin visually verifies. */
export function ApplicantSection({
  detail,
}: {
  detail: ApplicationReviewDetailResponseDto;
}) {
  const t = useTranslations("admin");
  const formatDate = useFormatDate();
  const a = detail.applicant;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("review.applicant.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label={t("review.applicant.fullName")} value={a.fullName} />
          <Field
            label={t("review.applicant.nationalId")}
            value={a.nationalId}
          />
          <Field
            label={t("review.applicant.dateOfBirth")}
            value={formatDate(a.dateOfBirth)}
          />
          <Field label={t("review.applicant.gender")} value={a.gender} />
          <Field label={t("review.applicant.mobile")} value={a.mobileNumber} />
          <Field label={t("review.applicant.email")} value={a.email} />
          <Field
            label={t("review.applicant.address")}
            value={
              a.address
                ? `${a.address}${a.district ? `, ${a.district}` : ""}${a.governorate ? `, ${a.governorate}` : ""}`
                : null
            }
          />
          <Field
            label={t("review.applicant.occupation")}
            value={a.occupation}
          />
          <Field
            label={t("review.applicant.maritalStatus")}
            value={a.maritalStatus}
          />
        </dl>
      </CardContent>
    </Card>
  );
}

const DOC_REVIEW_TONE: Record<
  CitizenDocumentResponseDto["reviewStatus"],
  string
> = {
  Pending: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-revoked/10 text-revoked",
};

/**
 * The decision's evidence: every active category requirement crossed with
 * the current upload of that type. Missing types sit visibly empty.
 */
export function CategoryMatrixSection({
  detail,
}: {
  detail: ApplicationReviewDetailResponseDto;
}) {
  const t = useTranslations("admin");
  const formatDate = useFormatDate();
  const requirements = detail.insuranceCategory.documentRequirements
    .filter((requirement) => requirement.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const currentDocs = new Map(
    detail.documents
      .filter((document) => document.isCurrent)
      .map((document) => [document.documentType, document]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("review.category.title", {
            category: detail.insuranceCategory.name,
          })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {requirements.map((requirement) => {
            const document = currentDocs.get(requirement.documentType);
            return (
              <li
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                key={requirement.id}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-sm font-medium">
                    {requirement.displayName}
                    {requirement.isMandatory ? (
                      <span aria-hidden className="text-revoked">
                        {" "}
                        *
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        ({t("review.category.optional")})
                      </span>
                    )}
                  </p>
                  {requirement.helpText ? (
                    <p className="text-xs text-muted-foreground">
                      {requirement.helpText}
                    </p>
                  ) : null}
                  {document ? (
                    <a
                      className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                      href={document.fileUrl ?? undefined}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="size-3" />
                      {document.fileName ?? t("review.category.viewFile")}
                      <span className="text-muted-foreground">
                        · {formatDate(document.uploadedAt)}
                      </span>
                    </a>
                  ) : (
                    <p className="text-xs font-medium text-warning">
                      {t("review.category.notUploaded")}
                    </p>
                  )}
                </div>
                {document ? (
                  <Badge className={DOC_REVIEW_TONE[document.reviewStatus]}>
                    {t(
                      `review.documents.reviewStatus.${document.reviewStatus}`,
                    )}
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    {t("review.category.missing")}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

/** Current documents + collapsed superseded history (re-uploads persist). */
export function DocumentsSection({
  detail,
}: {
  detail: ApplicationReviewDetailResponseDto;
}) {
  const t = useTranslations("admin");
  const formatDate = useFormatDate();
  const [showHistory, setShowHistory] = useState(false);

  const current = detail.documents.filter((document) => document.isCurrent);
  const superseded = detail.documents.filter((document) => !document.isCurrent);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("review.documents.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2">
          {current.map((document) => (
            <li
              className="flex items-center justify-between gap-3"
              key={document.id}
            >
              <a
                className="flex min-w-0 items-center gap-2 text-sm underline-offset-4 hover:underline"
                href={document.fileUrl ?? undefined}
                rel="noopener noreferrer"
                target="_blank"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {document.fileName ?? document.documentType}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(document.uploadedAt)}
                </span>
              </a>
              <Badge className={DOC_REVIEW_TONE[document.reviewStatus]}>
                {t(`review.documents.reviewStatus.${document.reviewStatus}`)}
              </Badge>
            </li>
          ))}
          {current.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              {t("review.documents.noneCurrent")}
            </li>
          ) : null}
        </ul>

        {superseded.length > 0 ? (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setShowHistory((value) => !value)}
              size="sm"
              variant="ghost"
            >
              {showHistory ? <ChevronUp /> : <ChevronDown />}
              {t("review.documents.superseded", { count: superseded.length })}
            </Button>
            {showHistory ? (
              <ul className="flex flex-col gap-2 border-t border-border pt-2">
                {superseded.map((document) => (
                  <li
                    className="flex items-center justify-between gap-3 opacity-70"
                    key={document.id}
                  >
                    <a
                      className="flex min-w-0 items-center gap-2 text-sm underline-offset-4 hover:underline"
                      href={document.fileUrl ?? undefined}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">
                        {document.fileName ?? document.documentType}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(document.uploadedAt)}
                      </span>
                    </a>
                    <Badge variant="outline">
                      {t("review.documents.supersededBadge")}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Dependents + eligibility/verification snapshots. */
export function ContextSection({
  detail,
}: {
  detail: ApplicationReviewDetailResponseDto;
}) {
  const t = useTranslations("admin");
  const formatDate = useFormatDate();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("review.dependents.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.dependents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("review.dependents.none")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {detail.dependents.map((dependent) => (
                <li
                  className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  key={dependent.relationshipId}
                >
                  <div className="flex min-w-0 flex-col">
                    <p className="text-sm font-medium">
                      {dependent.fullName ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        `review.dependents.relationship.${dependent.relationshipType}`,
                      )}
                      {" · "}
                      {formatDate(dependent.dateOfBirth)}
                    </p>
                  </div>
                  {dependent.isActive ? (
                    <Badge variant="outline">
                      <BadgeCheck className="size-3" />
                      {t("review.dependents.active")}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {t("review.dependents.inactive")}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("review.checks.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">
              {t("review.checks.eligibility")}
            </dt>
            <dd className="text-sm">
              {detail.eligibility ? (
                <>
                  <Badge
                    className={
                      detail.eligibility.status === "Eligible"
                        ? "bg-success/10 text-success"
                        : detail.eligibility.status === "NotEligible"
                          ? "bg-revoked/10 text-revoked"
                          : "bg-warning/10 text-warning"
                    }
                  >
                    {detail.eligibility.status}
                  </Badge>
                  <span className="ms-2 text-muted-foreground">
                    {formatDate(detail.eligibility.checkedAt)}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  {t("review.checks.notChecked")}
                </span>
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">
              {t("review.checks.verification")}
            </dt>
            <dd className="text-sm">
              {detail.verification ? (
                <>
                  <Badge
                    className={
                      detail.verification.status === "Verified"
                        ? "bg-success/10 text-success"
                        : detail.verification.status === "NotVerified"
                          ? "bg-revoked/10 text-revoked"
                          : "bg-warning/10 text-warning"
                    }
                  >
                    {detail.verification.status}
                  </Badge>
                  <span className="ms-2 text-muted-foreground">
                    {formatDate(detail.verification.verifiedAt)}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  {t("review.checks.notChecked")}
                </span>
              )}
            </dd>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/** Review history — the same connected-timeline pattern as citizen tracking. */
export function HistorySection({
  detail,
}: {
  detail: ApplicationReviewDetailResponseDto;
}) {
  const t = useTranslations("admin");
  const formatDate = useFormatDate();

  if (detail.reviewHistory.length === 0) return null;
  const history = [...detail.reviewHistory].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("review.history.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col">
          {history.map((entry, index) => (
            <li className="relative flex gap-3 pb-6 last:pb-0" key={entry.id}>
              {index < history.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute bottom-0 start-[11px] top-7 w-0.5 rounded-full bg-border"
                />
              ) : null}
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"
              >
                <BadgeCheck className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                <p className="text-sm font-medium">
                  {t("review.history.transition", {
                    from: t(`statuses.${entry.previousStatus}`),
                    to: t(`statuses.${entry.newStatus}`),
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(entry.reviewedAt)}
                </p>
                {entry.citizenVisibleReason ? (
                  <p className="text-xs text-muted-foreground">
                    {entry.citizenVisibleReason}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
