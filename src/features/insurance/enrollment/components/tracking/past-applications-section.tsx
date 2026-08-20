"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPLICATION_STATUS_TONE } from "../../../lib/application-status-tone";
import type { ApplicationResponseDto } from "../../types";
import { formatIsoDate } from "../../lib/format-iso-date";

/**
 * The patient's application history minus the one being tracked above.
 * Hidden entirely when there is nothing to show.
 */
export function PastApplicationsSection({
  applications,
  currentApplicationId,
}: {
  applications: ApplicationResponseDto[];
  currentApplicationId: string | null;
}) {
  const t = useTranslations("insurance");
  const locale = useLocale();

  const past = applications.filter(
    (application) => application.id !== currentApplicationId,
  );
  if (past.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tracking.history")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {past.map((application) => (
            <li
              key={application.id}
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-sm font-medium tabular-nums">
                  {t("enrollment.applicationNumber", {
                    number: application.applicationNumber,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatIsoDate(
                    application.submittedAt ?? application.createdAt,
                    locale,
                  )}
                </p>
                {application.decisionReason ? (
                  <p className="text-xs text-muted-foreground">
                    {application.decisionReason}
                  </p>
                ) : null}
              </div>
              <Badge className={APPLICATION_STATUS_TONE[application.status]}>
                {t(`enrollment.status.${application.status}`)}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
