"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import type { ApplicationResponseDto } from "../../../enrollment/types";
import { APPLICATION_STATUS_TONE } from "../../../lib/application-status-tone";
import type { ApplicationStatus } from "../../../types";
import { usePatientApplicationDetail } from "../hooks/use-card-lifecycle";
import { formatDate } from "./card-page-shared";

type SnapshotApplicationsListProps = {
  isPending: boolean;
  applications: ApplicationResponseDto[] | undefined;
  locale: string;
};

/** Application list with expandable review-history rows. */
export function SnapshotApplicationsList({
  isPending,
  applications,
  locale,
}: SnapshotApplicationsListProps) {
  const t = useTranslations("admin");
  const list = applications ?? [];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">
        {t("cards.snapshot.applications")}
      </p>
      {isPending ? (
        <Skeleton className="h-16 w-full" />
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("cards.snapshot.noApplications")}
        </p>
      ) : (
        list.map((application) => (
          <ApplicationRow
            applicationId={application.id}
            key={application.id}
            locale={locale}
            number={application.applicationNumber}
            status={application.status}
            submittedAt={application.submittedAt}
          />
        ))
      )}
    </div>
  );
}

function ApplicationRow({
  applicationId,
  number,
  status,
  submittedAt,
  locale,
}: {
  applicationId: string;
  number: string;
  status: ApplicationStatus;
  submittedAt: string | null;
  locale: string;
}) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const detail = usePatientApplicationDetail(applicationId, open);

  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <div className="rounded-lg border">
        <div className="flex items-start justify-between gap-2 p-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="font-medium tabular-nums">{number}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(submittedAt, locale)}
            </p>
            <Link
              className="text-xs text-primary underline-offset-4 hover:underline"
              href={`/dashboard/admin/applications/${applicationId}`}
            >
              {t("cards.snapshot.openReview")}
            </Link>
          </div>
          <Badge className={APPLICATION_STATUS_TONE[status]}>
            {t(`statuses.${status}`)}
          </Badge>
        </div>
        <CollapsibleTrigger asChild>
          <Button
            className="w-full rounded-none border-x-0 border-b-0"
            type="button"
            variant="ghost"
          >
            <ChevronDown className={open ? "rotate-180" : undefined} />
            {t("cards.snapshot.detail")}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t p-3">
            {detail.isPending ? (
              <Skeleton className="h-12 w-full" />
            ) : detail.isError ? (
              <p className="text-sm text-muted-foreground">
                {t("cards.snapshot.detailError")}
              </p>
            ) : detail.data && detail.data.reviewHistory.length > 0 ? (
              <ol className="flex flex-col gap-2">
                {detail.data.reviewHistory.map((entry) => (
                  <li className="text-sm" key={entry.id}>
                    {t("review.history.transition", {
                      from: t(`statuses.${entry.previousStatus}`),
                      to: t(`statuses.${entry.newStatus}`),
                    })}
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(entry.reviewedAt, locale)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("cards.snapshot.noHistory")}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
