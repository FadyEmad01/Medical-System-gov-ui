"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { APPLICATION_STATUS_TONE } from "../../../lib/application-status-tone";
import type { InsuranceStatusResponseDto } from "../../../types";

type SnapshotApplicationStatusProps = {
  isPending: boolean;
  status: InsuranceStatusResponseDto | null | undefined;
};

/** Aggregated application status line for the patient snapshot. */
export function SnapshotApplicationStatus({
  isPending,
  status,
}: SnapshotApplicationStatusProps) {
  const t = useTranslations("admin");

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-muted-foreground">
        {t("cards.snapshot.status")}
      </p>
      {isPending ? (
        <Skeleton className="h-8 w-full" />
      ) : status?.currentApplicationStatus ? (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          {status.currentApplicationNumber ?? "—"}
          <Badge
            className={APPLICATION_STATUS_TONE[status.currentApplicationStatus]}
          >
            {t(`statuses.${status.currentApplicationStatus}`)}
          </Badge>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("cards.snapshot.noStatus")}
        </p>
      )}
    </div>
  );
}
