"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApplicationStatus } from "../../../types";
import { PATIENT_QUEUE_STATUSES } from "../lib/patient-queue-filters";

export function PatientTableToolbar({
  status,
  onStatusChange,
  isRefetching,
  onRefresh,
  searchQuery,
  onSearchChange,
}: {
  status: ApplicationStatus | undefined;
  onStatusChange: (status: ApplicationStatus | null) => void;
  isRefetching: boolean;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  const t = useTranslations("admin");

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
          <SelectItem value="all">{t("cards.table.allStatuses")}</SelectItem>
          {PATIENT_QUEUE_STATUSES.map((queueStatus) => (
            <SelectItem key={queueStatus} value={queueStatus}>
              {t(`statuses.${queueStatus}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        aria-label={t("cards.table.searchPlaceholder")}
        className="flex-1"
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t("cards.table.searchPlaceholder")}
        value={searchQuery}
      />

      <Button disabled={isRefetching} onClick={onRefresh} variant="outline">
        <RefreshCw className={isRefetching ? "animate-spin" : undefined} />
        <span className="sr-only">{t("cards.table.refresh")}</span>
      </Button>
    </div>
  );
}
