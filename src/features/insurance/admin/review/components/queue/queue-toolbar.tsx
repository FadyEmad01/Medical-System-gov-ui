"use client";

import { RefreshCw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import type { ApplicationStatus } from "../../../../types";
import { getApplicationByNumberAction } from "../../actions";
import { QUEUE_STATUSES } from "../../lib/queue-filters";

export function QueueToolbar({
  status,
  numberQuery,
  onNumberQueryChange,
  onStatusChange,
  isRefetching,
  onRefresh,
}: {
  status: ApplicationStatus | undefined;
  numberQuery: string;
  onNumberQueryChange: (value: string) => void;
  onStatusChange: (status: ApplicationStatus | null) => void;
  isRefetching: boolean;
  onRefresh: () => void;
}) {
  const t = useTranslations("admin");
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        value={status ?? "all"}
        onValueChange={(value) =>
          onStatusChange(value === "all" ? null : (value as ApplicationStatus))
        }
      >
        <SelectTrigger className="w-full sm:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("queue.allStatuses")}</SelectItem>
          {QUEUE_STATUSES.map((queueStatus) => (
            <SelectItem key={queueStatus} value={queueStatus}>
              {t(`statuses.${queueStatus}`)}
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
          onChange={(event) => onNumberQueryChange(event.target.value)}
          placeholder={t("queue.searchPlaceholder")}
          value={numberQuery}
        />
        <Button type="submit" variant="outline">
          <Search data-icon="inline-start" />
          {t("queue.search")}
        </Button>
      </form>

      <Button disabled={isRefetching} onClick={onRefresh} variant="outline">
        <RefreshCw className={isRefetching ? "animate-spin" : undefined} />
        <span className="sr-only">{t("queue.refresh")}</span>
      </Button>
    </div>
  );
}
