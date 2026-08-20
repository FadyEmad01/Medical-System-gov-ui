"use client";

import { Inbox, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApplicationStatus } from "../../../../types";

export function QueueLoadingState() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      {Array.from({ length: 6 }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function QueueErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("admin");

  return (
    <Empty>
      <EmptyMedia variant="icon">
        <RefreshCw />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{t("queue.error.title")}</EmptyTitle>
        <EmptyDescription>{t("queue.error.description")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onRetry} variant="outline">
          {t("queue.retry")}
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function QueueEmptyState({
  status,
}: {
  status: ApplicationStatus | undefined;
}) {
  const t = useTranslations("admin");

  return (
    <Empty>
      <EmptyMedia variant="icon">
        <Inbox />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{t("queue.empty.title")}</EmptyTitle>
        <EmptyDescription>
          {status
            ? t("queue.empty.forStatus", {
                status: t(`statuses.${status}`),
              })
            : t("queue.empty.forAll")}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
