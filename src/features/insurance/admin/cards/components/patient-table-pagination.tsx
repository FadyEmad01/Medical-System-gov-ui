"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/**
 * Patient queue pagination over the server-paged result. Prev/next only
 * (jump-to-page adds little at 20 rows/page); bounds disable themselves;
 * RTL mirrors via logical icon swap.
 */
export function PatientTablePagination({
  page,
  totalCount,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations("admin");

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground tabular-nums">
        {t("cards.table.pagination.summary", {
          page,
          totalPages,
          count: totalCount,
        })}
      </p>
      <div className="flex gap-1">
        <Button
          aria-label={t("cards.table.pagination.prev")}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="icon"
          variant="outline"
        >
          <ChevronLeft className="rtl:rotate-180" />
        </Button>
        <Button
          aria-label={t("cards.table.pagination.next")}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          size="icon"
          variant="outline"
        >
          <ChevronRight className="rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
