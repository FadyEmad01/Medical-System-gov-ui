"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { FileText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";
import type { MedicalSummaryDto } from "../types";
import {
  clinicalPending,
  PendingBackendNotice,
} from "./pending-backend-notice";

/** GET /patients/{patientId}/medical-summary — flat "latest visit" snapshot. */
export function MedicalSummaryCard({
  patientId,
  summary,
}: {
  patientId: number;
  summary?: MedicalSummaryDto | null;
}) {
  const t = useTranslations("doctor");
  const locale = useLocale();
  const router = useRouter();
  const dateLocale = locale === "ar" ? arSA : enUS;

  return (
    <Card className="flex flex-col py-0">
      <CardHeader className="border-b border-border px-4 py-3">
        <CardTitle className="text-sm font-medium">
          {t("chart.summary.title")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("chart.summary.hint")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <PendingBackendNotice />
        {clinicalPending() ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
            <FileText className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("chart.summary.pendingBody", { patientId })}
            </p>
          </div>
        ) : summary === undefined ? null : summary === null ? (
          <p className="text-sm text-muted-foreground">
            {t("chart.summary.none")}
          </p>
        ) : (
          <>
            {summary.lastVisit ? (
              <button
                className="flex w-full flex-col items-start rounded-xl bg-muted p-3 text-start transition-colors hover:bg-muted/70"
                onClick={() =>
                  router.push(
                    `/dashboard/doctor/visits/${summary.lastVisit?.visitId}`,
                  )
                }
                type="button"
              >
                <span className="text-xs text-muted-foreground">
                  {t("chart.summary.lastVisit")}
                </span>
                <span className="mt-0.5 font-mono text-xs">
                  {format(new Date(summary.lastVisit.visitDate), "PPP", {
                    locale: dateLocale,
                  })}
                </span>
                <span className="text-sm font-medium">
                  {t(`visits.types.${summary.lastVisit.visitType}`)} ·{" "}
                  {summary.lastVisit.doctorName}
                </span>
              </button>
            ) : null}

            <div className="flex flex-col gap-2 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t("visits.fields.diagnosis")}
                </p>
                <p dir="auto">{summary.latestDiagnosis ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t("visits.fields.notes")}
                </p>
                <p className="whitespace-pre-wrap" dir="auto">
                  {summary.latestNotes ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t("visits.fields.requiredTests")}
                </p>
                <p dir="auto">{summary.latestRequiredTests ?? "—"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("medications.title")}
              </p>
              {summary.latestMedications.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("medications.empty")}
                </p>
              ) : (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {summary.latestMedications.map((medication, index) => (
                    <li
                      className="rounded-full bg-muted px-2.5 py-1 text-xs"
                      key={`${medication.medicationName}-${index}`}
                    >
                      <span className="font-medium" dir="auto">
                        {medication.medicationName}
                      </span>{" "}
                      <span className="text-muted-foreground" dir="auto">
                        {medication.dosage}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {summary.latestAttachments.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t("attachments.title")}
                </p>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {summary.latestAttachments.map((attachment) => (
                    <li
                      className="truncate text-xs text-muted-foreground"
                      key={attachment.attachmentId}
                    >
                      {attachment.fileName}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
