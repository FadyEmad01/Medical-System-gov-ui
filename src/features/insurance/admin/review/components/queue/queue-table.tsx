"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
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
import type { ApplicationResponseDto } from "../../../../enrollment/types";
import { APPLICATION_STATUS_TONE } from "../../../../lib/application-status-tone";

function formatIsoDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
}

/**
 * Queue rows carry no applicant identity (contract: plain
 * ApplicationResponseDto) — the application number is the entry point.
 */
export function QueueTable({ items }: { items: ApplicationResponseDto[] }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const OpenIcon = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("queue.columns.number")}</TableHead>
          <TableHead>{t("queue.columns.status")}</TableHead>
          <TableHead>{t("queue.columns.submittedAt")}</TableHead>
          <TableHead>{t("queue.columns.channel")}</TableHead>
          <TableHead className="text-end">
            {t("queue.columns.documents")}
          </TableHead>
          <TableHead className="text-end">
            {t("queue.columns.dependents")}
          </TableHead>
          <TableHead className="w-0" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((application) => (
          <TableRow key={application.id}>
            <TableCell>
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline tabular-nums"
                href={`/dashboard/admin/applications/${application.id}`}
              >
                {application.applicationNumber}
              </Link>
            </TableCell>
            <TableCell>
              <Badge className={APPLICATION_STATUS_TONE[application.status]}>
                {t(`statuses.${application.status}`)}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatIsoDate(application.submittedAt, locale)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {t(`channels.${application.submissionChannel}`)}
            </TableCell>
            <TableCell className="text-end tabular-nums">
              {application.documentCount}
            </TableCell>
            <TableCell className="text-end tabular-nums">
              {application.dependentCount}
            </TableCell>
            <TableCell>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/dashboard/admin/applications/${application.id}`}>
                  {t("queue.open")}
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
