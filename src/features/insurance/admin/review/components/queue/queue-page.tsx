"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";
import type { ApplicationStatus } from "../../../../types";
import { useApplicationQueue } from "../../hooks/use-application-queue";
import { parseQueueFilters, queueFiltersToParams } from "../../lib/queue-filters";
import { QueuePagination } from "./queue-pagination";
import {
  QueueEmptyState,
  QueueErrorState,
  QueueLoadingState,
} from "./queue-states";
import { QueueTable } from "./queue-table";
import { QueueToolbar } from "./queue-toolbar";

/**
 * The Admin application-review queue. Filter state lives in the URL
 * (?status=&page=) so views are shareable and the back button works; the
 * default view is the Submitted queue — the "needs review" inbox.
 */
export default function QueuePage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseQueueFilters(searchParams);
  const [numberQuery, setNumberQuery] = useState("");

  const { queueQuery, enabled } = useApplicationQueue({
    ...(filters.status ? { status: filters.status } : {}),
    page: filters.page,
  });

  const navigate = (next: { status?: ApplicationStatus; page?: number }) => {
    router.push(
      `/dashboard/admin/applications${queueFiltersToParams({
        status: next.status ?? filters.status,
        page: next.page ?? 1,
      })}`,
    );
  };

  const result = queueQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("queue.title")}</CardTitle>
          <CardDescription>{t("queue.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <QueueToolbar
            isRefetching={queueQuery.isRefetching}
            numberQuery={numberQuery}
            onNumberQueryChange={setNumberQuery}
            onRefresh={() => void queueQuery.refetch()}
            onStatusChange={(status) => navigate({ status })}
            status={filters.status}
          />

          {queueQuery.isPending && enabled ? (
            <QueueLoadingState />
          ) : queueQuery.isError ? (
            <QueueErrorState onRetry={() => void queueQuery.refetch()} />
          ) : result && result.items.length > 0 ? (
            <QueueTable items={result.items} />
          ) : (
            <QueueEmptyState status={filters.status} />
          )}

          {result && result.totalCount > 0 ? (
            <QueuePagination
              onPageChange={(page) => navigate({ page })}
              page={result.page}
              totalCount={result.totalCount}
              totalPages={result.totalPages}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
