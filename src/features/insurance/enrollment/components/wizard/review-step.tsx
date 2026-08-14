"use client";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { ProfileResponseDto } from "../../../types";
import {
  READINESS_QUERY_KEY,
  useSubmitEnrollment,
  useSummary,
} from "../../hooks/use-enrollment";
import { maskNationalId } from "../../lib/dependent-display";
import {
  DOCUMENT_TYPE_ICON,
  DOCUMENT_TYPE_LABEL_KEY,
} from "../../lib/document-type";
import type {
  DependentResponseDto,
  DocumentType,
  EnrollmentReadinessResponseDto,
} from "../../types";

/**
 * Step 5 — review + submit. Renders the full enrollment summary in sections
 * (category, profile, eligibility, dependents, documents) and gates the
 * submit button on the readiness snapshot. A submit that the server rejects
 * with a validation error invalidates readiness so this step re-reads the
 * refreshed missing-requirements list and renders it verbatim.
 */
export function ReviewStep({
  readiness,
  applicationCreatedAt,
  onBack,
}: {
  readiness: EnrollmentReadinessResponseDto;
  applicationCreatedAt: string;
  onBack: () => void;
}) {
  const t = useTranslations("insurance");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const summaryQuery = useSummary();
  const submit = useSubmitEnrollment();
  const [submitFailed, setSubmitFailed] = useState(false);

  const summary = summaryQuery.data;
  const submitting = submit.isPending;

  const handleSubmit = () => {
    setSubmitFailed(false);
    submit.mutate(undefined, {
      onError: (error) => {
        if (error.kind !== "validation") return;
        setSubmitFailed(true);
        // Re-read the gate so the inline alert below shows the fresh
        // missing requirements the server just rejected with.
        queryClient.invalidateQueries({ queryKey: READINESS_QUERY_KEY });
      },
    });
  };

  if (!summary) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

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
    <div className="flex flex-col gap-4">
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

          <ReviewSection title={t("review.eligibility")}>
            <div className="flex flex-col gap-2">
              {eligible ? (
                <p className="text-sm text-muted-foreground">
                  {t("review.eligibilityOk")}
                </p>
              ) : (
                <ul className="ms-4 flex list-disc flex-col gap-1 text-sm text-muted-foreground">
                  {summary.readiness.eligibilityViolations.map((violation) => (
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

          <ReviewSection title={t("review.dependents")}>
            {activeDependents.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {activeDependents.map((dependent) => (
                  <li
                    key={dependent.relationshipId}
                    className="flex flex-wrap items-center gap-2 text-sm"
                  >
                    <span className="font-medium">
                      {dependentName(dependent, t)}
                    </span>
                    <Badge variant="secondary">
                      {t(
                        `dependents.relationship.${dependent.relationshipType}`,
                      )}
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

          <ReviewSection title={t("review.documents")}>
            <div className="flex flex-col gap-2">
              {currentDocuments.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {currentDocuments.map((document) => {
                    const Icon = DOCUMENT_TYPE_ICON[document.documentType];
                    const labelKey =
                      DOCUMENT_TYPE_LABEL_KEY[document.documentType];
                    return (
                      <li
                        key={document.id}
                        className="flex flex-wrap items-center gap-2 text-sm"
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span>
                          {t.has(labelKey)
                            ? t(labelKey)
                            : document.documentType}
                        </span>
                        <Badge variant="secondary">
                          {t("documents.current")}
                        </Badge>
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

      {submitFailed ? (
        <Alert variant="destructive">
          <AlertTitle>{t("enrollment.submitFailed")}</AlertTitle>
          {readiness.missingRequirements.length > 0 ? (
            <AlertDescription>
              <ul className="ms-4 flex list-disc flex-col gap-1">
                {readiness.missingRequirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            </AlertDescription>
          ) : null}
        </Alert>
      ) : !readiness.isReady ? (
        <p className="text-sm text-muted-foreground">
          {t("review.submitDisabledHint")}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          {t("enrollment.back")}
        </Button>
        <Button
          type="button"
          disabled={!readiness.isReady || submitting}
          onClick={handleSubmit}
        >
          {submitting ? <Spinner data-icon="inline-start" /> : null}
          {submitting ? t("review.submitting") : t("review.submit")}
        </Button>
      </div>
    </div>
  );
}

function ReviewDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

/** Compact two-column dl of the summary profile's key fields. */
function ProfileSummary({ profile }: { profile: ProfileResponseDto }) {
  const t = useTranslations("insurance");
  const identity = (key: string) => t(`profile.identity.${key}`);
  const rows: Array<{ key: string; label: string; value: string | null }> = [
    {
      key: "fullName",
      label: identity("fullName"),
      value: profile.fullName ?? null,
    },
    {
      key: "nationalId",
      label: identity("nationalId"),
      value: profile.nationalId ?? null,
    },
    { key: "email", label: identity("email"), value: profile.email ?? null },
    {
      key: "occupation",
      label: identity("occupation"),
      value: profile.occupation ?? null,
    },
    {
      key: "maritalStatus",
      label: t("profile.field.maritalStatus"),
      value: profile.maritalStatus
        ? t(`profile.maritalStatus.${profile.maritalStatus}`)
        : null,
    },
    {
      key: "nationality",
      label: identity("nationality"),
      value: profile.nationality ?? null,
    },
    {
      key: "preferredLanguage",
      label: identity("preferredLanguage"),
      value: profile.preferredLanguage ?? null,
    },
    {
      key: "emergencyContactName",
      label: identity("emergencyContactName"),
      value: profile.emergencyContactName ?? null,
    },
    {
      key: "emergencyContactPhone",
      label: identity("emergencyContactPhone"),
      value: profile.emergencyContactPhone ?? null,
    },
  ];

  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.key} className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{row.label}</dt>
          <dd className="text-sm">
            {row.value ?? (
              <span aria-hidden="true" className="text-muted-foreground">
                —
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Readable dependent name: fullName, or gender · relationship fallback. */
function dependentName(
  dependent: DependentResponseDto,
  t: (key: string) => string,
): string {
  if (dependent.fullName) return dependent.fullName;
  return `${t(`dependents.gender.${dependent.gender}`)} · ${t(
    `dependents.relationship.${dependent.relationshipType}`,
  )}`;
}

/** Outline badges for the document types the readiness snapshot is missing. */
function DocumentTypeBadges({
  types,
  label,
}: {
  types: DocumentType[];
  label: string;
}) {
  const t = useTranslations("insurance");

  if (types.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {types.map((type) => {
          const Icon = DOCUMENT_TYPE_ICON[type];
          const labelKey = DOCUMENT_TYPE_LABEL_KEY[type];
          return (
            <Badge key={type} variant="outline">
              <Icon data-icon="inline-start" />
              {t.has(labelKey) ? t(labelKey) : type}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

function formatIsoDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
}
