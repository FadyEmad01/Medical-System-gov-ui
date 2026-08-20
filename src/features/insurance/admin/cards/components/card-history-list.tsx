"use client";

import { CircleAlert, History } from "lucide-react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import type { CardDetailResponseDto } from "../../../types";
import { formatDate } from "./card-page-shared";

type CardHistoryListProps = {
  locale: string;
  isPending: boolean;
  isError: boolean;
  detail: CardDetailResponseDto | undefined;
};

/**
 * Expandable per-card audit trail: status change timeline with reasons.
 */
export function CardHistoryList({
  locale,
  isPending,
  isError,
  detail,
}: CardHistoryListProps) {
  const t = useTranslations("admin");

  if (isPending) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (isError) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CircleAlert className="size-4" />
        {t("cards.errors.history")}
      </p>
    );
  }

  if (detail && detail.statusHistory.length > 0) {
    return (
      <ol className="flex flex-col">
        {[...detail.statusHistory].reverse().map((change, index, all) => (
          <li
            className="relative flex gap-3 pb-4 last:pb-0"
            key={change.id}
          >
            {index < all.length - 1 ? (
              <span
                aria-hidden
                className="absolute bottom-0 start-[11px] top-6 w-0.5 rounded-full bg-border"
              />
            ) : null}
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-info/10 text-info"
            >
              <History className="size-3.5" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-sm font-medium">
                {t("cards.change", {
                  from: t(`cards.status.${change.previousStatus}`),
                  to: t(`cards.status.${change.newStatus}`),
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(change.changedAt, locale)}
              </p>
              {change.reason ? (
                <p className="text-xs text-muted-foreground">{change.reason}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">{t("cards.errors.noHistory")}</p>
  );
}
