"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { APPLICATION_STATUS_TONE } from "../../../lib/application-status-tone";
import { CARD_STATUS_TONE } from "../../../lib/card-status-tone";
import type { EnrichedApplicationDto } from "../types";

/**
 * Patient table for the cards lookup page. Rows carry enriched patient
 * identity fields (patientName, nationalId, cardStatus) alongside the
 * standard application fields.
 */
export function PatientTable({ items }: { items: EnrichedApplicationDto[] }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const OpenIcon = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("cards.table.columns.patientName")}</TableHead>
          <TableHead>{t("cards.table.columns.nationalId")}</TableHead>
          <TableHead>{t("cards.table.columns.applicationNumber")}</TableHead>
          <TableHead>{t("cards.table.columns.status")}</TableHead>
          <TableHead>{t("cards.table.columns.cardStatus")}</TableHead>
          <TableHead className="text-end">
            {t("cards.table.columns.documents")}
          </TableHead>
          <TableHead className="w-0" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="min-w-0 flex-1">
              <Link
                className="underline-offset-4 hover:underline truncate block"
                href={`/dashboard/admin/cards/${item.patientId}`}
              >
                {item.patientName ?? "—"}
              </Link>
            </TableCell>
            <TableCell className="tabular-nums">
              {item.nationalId ?? "—"}
            </TableCell>
            <TableCell>
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline tabular-nums"
                href={`/dashboard/admin/applications/${item.id}`}
              >
                {item.applicationNumber}
              </Link>
            </TableCell>
            <TableCell>
              <Badge className={APPLICATION_STATUS_TONE[item.status]}>
                {t(`statuses.${item.status}`)}
              </Badge>
            </TableCell>
            <TableCell>
              {item.cardStatus ? (
                <Badge className={CARD_STATUS_TONE[item.cardStatus]}>
                  {t(`cards.statuses.${item.cardStatus}`)}
                </Badge>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="text-end tabular-nums">
              {item.documentCount}
            </TableCell>
            <TableCell>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/dashboard/admin/cards/${item.patientId}`}>
                  {t("cards.table.open")}
                  <OpenIcon data-icon="inline-end" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
