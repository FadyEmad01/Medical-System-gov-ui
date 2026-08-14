"use client";

import { useTranslations } from "next-intl";
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
import { Link } from "@/i18n/navigation";
import {
  DOCUMENT_TYPE_ICON,
  DOCUMENT_TYPE_LABEL_KEY,
} from "../../lib/document-type";
import type {
  EnrollmentReadinessResponseDto,
  EnrollmentResponseDto,
} from "../../types";

/**
 * Step 1 — eligibility. Shows the chosen category and the backend's
 * eligibility verdict. When the category is not eligible, the patient can
 * jump back to the landing page to pick another one.
 */
export function EligibilityStep({
  enrollment,
  readiness,
}: {
  enrollment: EnrollmentResponseDto;
  readiness: EnrollmentReadinessResponseDto;
}) {
  const t = useTranslations("insurance");
  const category = enrollment.insuranceCategory;

  const eligible =
    readiness.isEligibleForCategory &&
    readiness.eligibilityViolations.length === 0;

  const hasMissing =
    readiness.missingRequirements.length > 0 ||
    readiness.missingDocumentTypes.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{category.name}</CardTitle>
          {category.description ? (
            <CardDescription>{category.description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {t(`enrollment.status.${enrollment.applicationStatus}`)}
            </Badge>
            <Badge variant="outline">
              {t("enrollment.applicationNumber", {
                number: enrollment.applicationNumber,
              })}
            </Badge>
          </div>

          {eligible ? (
            <p className="text-sm text-muted-foreground">
              {t("enrollment.eligibility.eligible")}
            </p>
          ) : (
            <Alert variant="destructive">
              <AlertTitle>
                {t("enrollment.eligibility.notEligibleHint")}
              </AlertTitle>
              <AlertDescription>
                <ul className="ms-4 flex list-disc flex-col gap-1">
                  {readiness.eligibilityViolations.map((violation) => (
                    <li key={violation}>{violation}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {hasMissing ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                {t("documents.missing")}
              </p>
              {readiness.missingRequirements.length > 0 ? (
                <ul className="ms-4 flex list-disc flex-col gap-1 text-sm text-muted-foreground">
                  {readiness.missingRequirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              ) : null}
              {readiness.missingDocumentTypes.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {readiness.missingDocumentTypes.map((type) => {
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
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {!eligible ? (
        <Button asChild variant="outline">
          <Link href="/dashboard/insurance">
            {t("enrollment.eligibility.browseCategories")}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
