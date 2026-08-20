"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIsoDate } from "../../lib/format-iso-date";
import { useApplicationDetail } from "../../hooks/use-enrollment";
import { CancelDialog } from "./cancel-dialog";

/** View-only application summary for submitted / under-review applications. */
export function ReviewSummaryPanel({
  detailQuery,
  applicationId,
}: {
  detailQuery: ReturnType<typeof useApplicationDetail>;
  applicationId: string | undefined;
}) {
  const t = useTranslations("insurance");
  const locale = useLocale();

  if (detailQuery.isPending) {
    return (
      <Card aria-busy="true">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 4 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows, never reordered
              <div key={index} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    );
  }

  const detail = detailQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tracking.details")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <TrackingDetail
            label={t("tracking.submissionChannel")}
            value={
              detail
                ? t(`tracking.submissionChannels.${detail.submissionChannel}`)
                : "—"
            }
          />
          <TrackingDetail
            label={t("tracking.submittedAt")}
            value={
              detail?.submittedAt
                ? formatIsoDate(detail.submittedAt, locale)
                : "—"
            }
          />
          <TrackingDetail
            label={t("tracking.documentCount")}
            value={detail ? `${detail.documentCount}` : "—"}
          />
          <TrackingDetail
            label={t("tracking.dependentCount")}
            value={detail ? `${detail.dependentCount}` : "—"}
          />
        </dl>
        <div className="flex">
          <CancelDialog applicationId={applicationId} />
        </div>
      </CardContent>
    </Card>
  );
}

function TrackingDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
