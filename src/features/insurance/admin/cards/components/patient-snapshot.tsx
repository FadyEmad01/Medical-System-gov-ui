"use client";

import { CreditCard } from "lucide-react";
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
  useCurrentCard,
  useIssueCards,
  usePatientApplications,
  usePatientStatus,
} from "../hooks/use-card-lifecycle";
import { SnapshotApplicationStatus } from "./snapshot-application-status";
import { SnapshotApplicationsList } from "./snapshot-applications-list";
import { SnapshotCurrentCard } from "./snapshot-current-card";

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
        <SnapshotCurrentCard card={current.data} isPending={current.isPending} />
        <SnapshotApplicationStatus
          isPending={status.isPending}
          status={status.data}
        />
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
        <SnapshotApplicationsList
          applications={applications.data}
          isPending={applications.isPending}
          locale={locale}
        />
      </CardContent>
    </Card>
  );
}
