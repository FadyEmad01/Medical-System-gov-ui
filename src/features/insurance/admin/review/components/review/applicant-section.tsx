"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationReviewDetailResponseDto } from "../../types";
import { Field, useFormatDate } from "./review-shared";

/** Applicant identity — the fields an admin visually verifies. */
export function ApplicantSection({
  detail,
}: {
  detail: ApplicationReviewDetailResponseDto;
}) {
  const t = useTranslations("admin");
  const formatDate = useFormatDate();
  const applicant = detail.applicant;

  // Applicant record gone server-side — nothing to visually verify.
  if (!applicant) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("review.applicant.unavailable")}
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("review.applicant.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field
            label={t("review.applicant.fullName")}
            value={applicant.fullName}
          />
          <Field
            label={t("review.applicant.nationalId")}
            value={applicant.nationalId}
          />
          <Field
            label={t("review.applicant.dateOfBirth")}
            value={formatDate(applicant.dateOfBirth)}
          />
          <Field
            label={t("review.applicant.gender")}
            value={applicant.gender}
          />
          <Field
            label={t("review.applicant.mobile")}
            value={applicant.mobileNumber}
          />
          <Field label={t("review.applicant.email")} value={applicant.email} />
          <Field
            label={t("review.applicant.address")}
            value={
              applicant.address
                ? `${applicant.address}${applicant.district ? `, ${applicant.district}` : ""}${applicant.governorate ? `, ${applicant.governorate}` : ""}`
                : null
            }
          />
          <Field
            label={t("review.applicant.occupation")}
            value={applicant.occupation}
          />
          <Field
            label={t("review.applicant.maritalStatus")}
            value={applicant.maritalStatus}
          />
        </dl>
      </CardContent>
    </Card>
  );
}
