"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { ChevronDown, CreditCard } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { APPLICATION_STATUS_TONE } from "../../../lib/application-status-tone";
import { CARD_STATUS_TONE } from "../../../lib/card-status-tone";
import type { ApplicationStatus } from "../../../types";
import {
  useCurrentCard,
  useIssueCards,
  usePatientApplicationDetail,
  usePatientApplications,
  usePatientStatus,
} from "../hooks/use-card-lifecycle";

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
}

/**
 * Patient-scoped reads that also appear in admin-swagger: current card,
 * aggregated status, application list, and lazy application detail.
 */
export function PatientSnapshot({ patientId }: { patientId: number }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const current = useCurrentCard(patientId);
  const status = usePatientStatus(patientId);
  const applications = usePatientApplications(patientId);
  const issue = useIssueCards(
    status.data?.currentApplicationId ?? "",
    patientId,
  );
  const canIssue =
    status.data?.currentApplicationStatus === "Approved" &&
    current.data === null &&
    Boolean(status.data.currentApplicationId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cards.snapshot.title")}</CardTitle>
        <CardDescription>{t("cards.snapshot.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t("cards.snapshot.current")}
          </p>
          {current.isPending ? (
            <Skeleton className="h-8 w-full" />
          ) : current.data ? (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium tabular-nums">
                {current.data.cardNumber ?? "—"}
              </span>
              <Badge className={CARD_STATUS_TONE[current.data.status]}>
                {t(`cards.status.${current.data.status}`)}
              </Badge>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("cards.snapshot.noCurrent")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t("cards.snapshot.status")}
          </p>
          {status.isPending ? (
            <Skeleton className="h-8 w-full" />
          ) : status.data?.currentApplicationStatus ? (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              {status.data.currentApplicationNumber ?? "—"}
              <Badge
                className={
                  APPLICATION_STATUS_TONE[status.data.currentApplicationStatus]
                }
              >
                {t(`statuses.${status.data.currentApplicationStatus}`)}
              </Badge>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("cards.snapshot.noStatus")}
            </p>
          )}
        </div>

        {canIssue ? (
          <Button
            disabled={issue.isPending}
            onClick={() => issue.mutate()}
            size="sm"
            variant="outline"
          >
            <CreditCard data-icon="inline-start" />
            {t("actions.issue.label")}
          </Button>
        ) : null}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {t("cards.snapshot.applications")}
          </p>
          {applications.isPending ? (
            <Skeleton className="h-16 w-full" />
          ) : (applications.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("cards.snapshot.noApplications")}
            </p>
          ) : (
            (applications.data ?? []).map((application) => (
              <ApplicationRow
                applicationId={application.id}
                key={application.id}
                locale={locale}
                number={application.applicationNumber}
                status={application.status}
                submittedAt={application.submittedAt}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationRow({
  applicationId,
  number,
  status,
  submittedAt,
  locale,
}: {
  applicationId: string;
  number: string;
  status: ApplicationStatus;
  submittedAt: string | null;
  locale: string;
}) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const detail = usePatientApplicationDetail(applicationId, open);

  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <div className="rounded-lg border">
        <div className="flex items-start justify-between gap-2 p-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="font-medium tabular-nums">{number}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(submittedAt, locale)}
            </p>
            <Link
              className="text-xs text-primary underline-offset-4 hover:underline"
              href={`/dashboard/admin/applications/${applicationId}`}
            >
              {t("cards.snapshot.openReview")}
            </Link>
          </div>
          <Badge className={APPLICATION_STATUS_TONE[status]}>
            {t(`statuses.${status}`)}
          </Badge>
        </div>
        <CollapsibleTrigger asChild>
          <Button
            className="w-full rounded-none border-x-0 border-b-0"
            type="button"
            variant="ghost"
          >
            <ChevronDown className={open ? "rotate-180" : undefined} />
            {t("cards.snapshot.detail")}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t p-3">
            {detail.isPending ? (
              <Skeleton className="h-12 w-full" />
            ) : detail.isError ? (
              <p className="text-sm text-muted-foreground">
                {t("cards.snapshot.detailError")}
              </p>
            ) : detail.data && detail.data.reviewHistory.length > 0 ? (
              <ol className="flex flex-col gap-2">
                {detail.data.reviewHistory.map((entry) => (
                  <li className="text-sm" key={entry.id}>
                    {t("review.history.transition", {
                      from: t(`statuses.${entry.previousStatus}`),
                      to: t(`statuses.${entry.newStatus}`),
                    })}
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(entry.reviewedAt, locale)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("cards.snapshot.noHistory")}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
