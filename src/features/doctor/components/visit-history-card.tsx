"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "@/i18n/navigation";
import type { VisitSummaryDto } from "../types";
import {
  clinicalPending,
  PendingBackendNotice,
} from "./pending-backend-notice";

/** GET /patients/{patientId}/visit-history — chronological flat rows (no status column in the contract). */
export function VisitHistoryCard({
  patientId,
  rows,
  onOpenNewVisit,
}: {
  patientId: number;
  rows?: VisitSummaryDto[];
  onOpenNewVisit: () => void;
}) {
  const t = useTranslations("doctor");
  const locale = useLocale();
  const router = useRouter();
  const dateLocale = locale === "ar" ? arSA : enUS;

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <CardTitle className="text-sm font-medium">
            {t("chart.history.title")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("chart.history.hint")}
          </CardDescription>
        </div>
        <Button
          onClick={onOpenNewVisit}
          size="sm"
          type="button"
          variant="outline"
        >
          {t("chart.history.newVisit")}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4">
        <PendingBackendNotice />
        {clinicalPending() ? null : rows && rows.length > 0 ? (
          <Table className="min-w-[640px]">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="px-4 text-xs font-medium">
                  {t("chart.history.date")}
                </TableHead>
                <TableHead className="px-4 text-xs font-medium">
                  {t("chart.history.doctor")}
                </TableHead>
                <TableHead className="px-4 text-xs font-medium">
                  {t("chart.history.type")}
                </TableHead>
                <TableHead className="px-4 text-xs font-medium">
                  {t("chart.history.diagnosis")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  className="cursor-pointer"
                  key={row.visitId}
                  onClick={() =>
                    router.push(`/dashboard/doctor/visits/${row.visitId}`)
                  }
                >
                  <TableCell className="px-4 font-mono text-xs">
                    {format(new Date(row.visitDate), "PPP", {
                      locale: dateLocale,
                    })}
                  </TableCell>
                  <TableCell className="px-4 text-sm">
                    {row.doctorName}
                  </TableCell>
                  <TableCell className="px-4 text-sm">
                    {t(`visits.types.${row.visitType}`)}
                  </TableCell>
                  <TableCell
                    className="max-w-[20rem] truncate px-4 text-muted-foreground"
                    dir="auto"
                  >
                    {row.diagnosisSummary ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : rows ? (
          <p className="text-sm text-muted-foreground">
            {t("chart.history.empty", { patientId })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
