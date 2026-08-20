"use client";

import { FileSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { APPLICATION_STATUS_TONE } from "../../../lib/application-status-tone";
import type { ApplicationStatus } from "../../../types";

/** No-application empty state with a CTA back to the landing page. */
export function NoApplicationState() {
  const t = useTranslations("insurance");

  return (
    <Empty>
      <EmptyMedia variant="icon">
        <FileSearch />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{t("tracking.noApplication")}</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/dashboard/insurance">{t("tracking.startNew")}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

/** Structural placeholder mirroring the loaded layout (no mid-content spinner). */
export function TrackingSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-52" />
        </CardContent>
      </Card>
      <Card>
        <CardHeaderSkeleton />
        <CardContent className="flex flex-col gap-5">
          {Array.from({ length: 4 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows, never reordered
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-6 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CardHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 px-6 pt-6">
      <Skeleton className="h-5 w-24" />
    </div>
  );
}

export function TrackingHeader({
  applicationNumber,
  applicationStatus,
  completedStages,
  totalStages,
}: {
  applicationNumber: string | undefined;
  applicationStatus: ApplicationStatus;
  completedStages: number;
  totalStages: number;
}) {
  const t = useTranslations("insurance");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle>{t("tracking.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("enrollment.applicationNumber", {
                number: applicationNumber ?? "—",
              })}
            </p>
            {totalStages > 0 ? (
              <p className="text-xs text-muted-foreground tabular-nums">
                {t("tracking.progress", {
                  done: completedStages,
                  total: totalStages,
                })}
              </p>
            ) : null}
          </div>
          <Badge
            className={`gap-1.5 px-3 py-1 text-sm ${APPLICATION_STATUS_TONE[applicationStatus]}`}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {t(`enrollment.status.${applicationStatus}`)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
