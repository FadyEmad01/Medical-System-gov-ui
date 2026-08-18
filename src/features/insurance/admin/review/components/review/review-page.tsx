"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { CircleAlert, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { isAuthActionError } from "../../../../hooks/session-guard";
import { APPLICATION_STATUS_TONE } from "../../../../lib/application-status-tone";
import { useReviewDetail } from "../../hooks/use-review-detail";
import { ReviewActionBar } from "./action-bar";
import {
  ApplicantSection,
  CategoryMatrixSection,
  ContextSection,
  DocumentsSection,
  HistorySection,
} from "./review-sections";

/**
 * The Admin review screen.
 *
 * CLIENT-RENDERED BY DESIGN: the review GET auto-claims a Submitted
 * application, so this bundle must never be fetched during server render or
 * route prefetch (an RSC prefetch would auto-claim on hover). The hook runs
 * exactly once per visit (staleTime Infinity, no focus refetch, no retry).
 */
export default function ReviewPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const params = useParams<{ applicationId: string }>();
  const applicationId = params.applicationId;
  const query = useReviewDetail(applicationId);

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>{t("review.error.title")}</AlertTitle>
        <AlertDescription>
          {isAuthActionError(query.error) && query.error.kind === "notFound"
            ? t("review.error.notFound")
            : t("review.error.description")}
        </AlertDescription>
        <AlertAction>
          <Button
            onClick={() => void query.refetch()}
            size="sm"
            variant="outline"
          >
            <RefreshCw data-icon="inline-start" />
            {t("review.error.retry")}
          </Button>
        </AlertAction>
      </Alert>
    );
  }

  if (query.isPending || !query.data) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const detail = query.data;
  const submittedAt = detail.submittedAt
    ? format(new Date(detail.submittedAt), "PPP", {
        locale: locale === "ar" ? arSA : enUS,
      })
    : "—";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <CardTitle className="text-base">
                {detail.applicationNumber}
              </CardTitle>
              <p className="text-sm font-medium">{detail.applicant.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {t("review.header.submittedAt", { date: submittedAt })}
              </p>
              <Link
                className="text-xs text-primary underline-offset-4 hover:underline"
                href={`/dashboard/admin/cards/${detail.patientId}`}
              >
                {t("review.header.viewCards")}
              </Link>
            </div>
            <Badge
              className={`gap-1.5 px-3 py-1 text-sm ${APPLICATION_STATUS_TONE[detail.status]}`}
            >
              <span aria-hidden className="size-1.5 rounded-full bg-current" />
              {t(`statuses.${detail.status}`)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <ApplicantSection detail={detail} />
      <CategoryMatrixSection detail={detail} />
      <DocumentsSection detail={detail} />
      <ContextSection detail={detail} />
      <HistorySection detail={detail} />

      <ReviewActionBar
        applicationId={detail.id}
        decisionReason={detail.decisionReason}
        patientId={detail.patientId}
        status={detail.status}
      />
    </div>
  );
}
