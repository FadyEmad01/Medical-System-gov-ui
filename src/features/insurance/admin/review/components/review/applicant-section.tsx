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
