"use client";

import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationReviewDetailResponseDto } from "../../types";
import { useFormatDate } from "./review-shared";

/** Review history — the same connected-timeline pattern as citizen tracking. */
export function HistorySection({
  detail,
}: {
  detail: ApplicationReviewDetailResponseDto;
}) {
  const t = useTranslations("admin");
  const formatDate = useFormatDate();

  if (detail.reviewHistory.length === 0) return null;
  const history = [...detail.reviewHistory].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("review.history.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col">
          {history.map((entry, index) => (
            <li className="relative flex gap-3 pb-6 last:pb-0" key={entry.id}>
              {index < history.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute bottom-0 start-[11px] top-7 w-0.5 rounded-full bg-border"
                />
              ) : null}
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"
              >
                <BadgeCheck className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                <p className="text-sm font-medium">
                  {t("review.history.transition", {
                    from: t(`statuses.${entry.previousStatus}`),
                    to: t(`statuses.${entry.newStatus}`),
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(entry.reviewedAt)}
                </p>
                {entry.citizenVisibleReason ? (
                  <p className="text-xs text-muted-foreground">
                    {entry.citizenVisibleReason}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
