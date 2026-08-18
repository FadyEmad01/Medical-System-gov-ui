"use client";

import { Inbox, RefreshCw, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { APPLICATION_STATUS_TONE } from "../../../../lib/application-status-tone";
import type { ApplicationStatus } from "../../../../types";
import { getApplicationByNumberAction } from "../../actions";
import { useApplicationQueue } from "../../hooks/use-application-queue";
import {
  parseQueueFilters,
  QUEUE_STATUSES,
  queueFiltersToParams,
} from "../../lib/queue-filters";
import { QueuePagination } from "./queue-pagination";
import { QueueTable } from "./queue-table";

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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={filters.status ?? "all"}
              onValueChange={(value) =>
                navigate({
                  status:
                    value === "all" ? undefined : (value as ApplicationStatus),
                })
              }
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("queue.allStatuses")}</SelectItem>
                {QUEUE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`statuses.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <form
              className="flex flex-1 gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                const number = numberQuery.trim();
                if (number === "") return;
                // Resolve the printed reference to its GUID, then navigate.
                // (A by-number URL segment would collide with the
                // [applicationId] dynamic route.)
                const res = await getApplicationByNumberAction(number);
                if (res.ok) {
                  router.push(`/dashboard/admin/applications/${res.data.id}`);
                } else {
                  toast.error(t("queue.searchNotFound"));
                }
              }}
            >
              <Input
                aria-label={t("queue.searchLabel")}
                className="flex-1"
                onChange={(event) => setNumberQuery(event.target.value)}
                placeholder={t("queue.searchPlaceholder")}
                value={numberQuery}
              />
              <Button type="submit" variant="outline">
                <Search data-icon="inline-start" />
                {t("queue.search")}
              </Button>
            </form>

            <Button
              disabled={queueQuery.isRefetching}
              onClick={() => void queueQuery.refetch()}
              variant="outline"
            >
              <RefreshCw
                className={queueQuery.isRefetching ? "animate-spin" : undefined}
              />
              <span className="sr-only">{t("queue.refresh")}</span>
            </Button>
          </div>

          {queueQuery.isPending && enabled ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              {Array.from({ length: 6 }).map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : queueQuery.isError ? (
            <Empty>
              <EmptyMedia variant="icon">
                <RefreshCw />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{t("queue.error.title")}</EmptyTitle>
                <EmptyDescription>
                  {t("queue.error.description")}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  onClick={() => void queueQuery.refetch()}
                  variant="outline"
                >
                  {t("queue.retry")}
                </Button>
              </EmptyContent>
            </Empty>
          ) : result && result.items.length > 0 ? (
            <QueueTable items={result.items} />
          ) : (
            <Empty>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{t("queue.empty.title")}</EmptyTitle>
                <EmptyDescription>
                  {filters.status
                    ? t("queue.empty.forStatus", {
                        status: t(`statuses.${filters.status}`),
                      })
                    : t("queue.empty.forAll")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
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
