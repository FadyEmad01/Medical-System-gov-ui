"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InsuranceVerificationResponseDto } from "@/features/insurance/verification/types";
import { verificationStatusTone } from "@/features/insurance/verification/lib/status-tones";

type VerificationHistoryProps = {
  patientId: number | null;
  rows: InsuranceVerificationResponseDto[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

export function VerificationHistory({
  patientId,
  rows,
  isLoading,
  isError = false,
  onRetry,
}: VerificationHistoryProps) {
  const t = useTranslations("doctor");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? arSA : enUS;

  return (
    <Card className="py-0" id="history">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
        <div>
          <CardTitle className="text-sm font-medium">
            {t("history.title")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("history.hint")}
          </CardDescription>
        </div>
        <span className="text-xs text-muted-foreground">
          {t("history.newestFirst")}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        {patientId === null ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            {t("history.needPatient")}
          </p>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 px-4 py-6">
            <p className="text-sm text-destructive">{t("errors.generic")}</p>
            {onRetry ? (
              <Button onClick={onRetry} size="sm" type="button" variant="outline">
                {t("errors.retry")}
              </Button>
            ) : null}
          </div>
        ) : isLoading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            {t("history.empty")}
          </p>
        ) : (
          <Table className="min-w-[640px]">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="px-4 text-xs font-medium">
                  {t("history.when")}
                </TableHead>
                <TableHead className="px-4 text-xs font-medium">
                  {t("history.status")}
                </TableHead>
                <TableHead className="px-4 text-xs font-medium">
                  {t("history.context")}
                </TableHead>
                <TableHead className="px-4 text-xs font-medium">
                  {t("history.validNow")}
                </TableHead>
                <TableHead className="px-4 text-xs font-medium">
                  {t("history.reason")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-4 font-mono text-xs">
                    {format(new Date(row.verifiedAt), "MMM d, HH:mm", {
                      locale: dateLocale,
                    })}
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge className={verificationStatusTone(row.status)}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4">{row.context ?? "—"}</TableCell>
                  <TableCell
                    className={
                      row.isCurrentlyValid
                        ? "px-4 text-success"
                        : "px-4 text-muted-foreground"
                    }
                  >
                    {row.isCurrentlyValid ? t("history.yes") : t("history.no")}
                  </TableCell>
                  <TableCell className="max-w-[20rem] truncate px-4 text-muted-foreground">
                    {row.reason ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
