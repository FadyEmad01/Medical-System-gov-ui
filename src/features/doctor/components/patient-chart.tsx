"use client";

import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parsePatientId } from "@/features/insurance/lib/parse-patient-id";
import { useRouter } from "@/i18n/navigation";
import {
  useMedicalSummary,
  useVisitHistory,
} from "../hooks/use-clinical-chart";
import {
  useCoverageSnapshot,
  useVerificationHistory,
} from "../hooks/use-point-of-care";
import { CoverageSnapshot } from "./coverage-snapshot";
import { MedicalSummaryCard } from "./medical-summary-card";
import { RecordVerificationPanel } from "./record-verification-panel";
import { VerificationHistory } from "./verification-history";
import { VisitHistoryCard } from "./visit-history-card";

/**
 * Patient chart: wired insurance point-of-care panels (coverage snapshot,
 * record verification, verification history) + clinical sections (medical
 * summary, visit history) that light up when the backend ships.
 */
export function PatientChart() {
  const t = useTranslations("doctor");
  const router = useRouter();
  const params = useParams<{ patientId: string }>();
  const patientId = parsePatientId(params.patientId ?? "");

  const snapshot = useCoverageSnapshot(patientId);
  const insuranceHistory = useVerificationHistory(patientId);
  const medicalSummary = useMedicalSummary(patientId ?? 0);
  const visitHistory = useVisitHistory(patientId ?? 0);

  if (patientId === null) {
    return (
      <Card className="py-0">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            {t("errors.notFound")}
          </p>
          <Button
            className="mt-3"
            onClick={() => router.push("/dashboard/doctor")}
            size="sm"
            type="button"
            variant="outline"
          >
            {t("chart.backToWorkspace")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isLoading =
    snapshot.eligibility.isFetching ||
    snapshot.current.isFetching ||
    snapshot.latest.isFetching;
  const snapshotError =
    snapshot.eligibility.isError ||
    snapshot.current.isError ||
    snapshot.latest.isError;
  const fullName =
    snapshot.eligibility.data?.patientFullName ??
    snapshot.current.data?.patientFullName ??
    snapshot.latest.data?.patientFullName ??
    medicalSummary.data?.fullName ??
    null;
  const nationalId =
    snapshot.eligibility.data?.patientNationalId ??
    snapshot.current.data?.patientNationalId ??
    snapshot.latest.data?.patientNationalId ??
    medicalSummary.data?.nationalId ??
    null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex flex-col gap-2">
        <Button
          className="self-start px-2 text-muted-foreground"
          onClick={() => router.push("/dashboard/doctor")}
          size="sm"
          type="button"
          variant="ghost"
        >
          <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
          {t("chart.backToWorkspace")}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-medium">
            {fullName ?? t("strip.noName", { id: patientId })}
          </h1>
          <Badge className="bg-muted text-muted-foreground" variant="secondary">
            {t("strip.patientId")}: {patientId}
          </Badge>
          {nationalId ? (
            <Badge
              className="bg-muted text-muted-foreground"
              variant="secondary"
            >
              {t("strip.nidMasked", { masked: `••${nationalId.slice(-4)}` })}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("chart.description")}
        </p>
      </header>

      <div className="grid flex-1 gap-4 xl:grid-cols-3">
        <CoverageSnapshot
          current={snapshot.current.data}
          eligibility={snapshot.eligibility.data}
          isError={snapshotError}
          isLoading={isLoading}
          latest={snapshot.latest.data}
          onRetry={() => {
            void snapshot.eligibility.refetch();
            void snapshot.current.refetch();
            void snapshot.latest.refetch();
          }}
          patientId={patientId}
        />
        <RecordVerificationPanel patientId={patientId} />
        <MedicalSummaryCard
          patientId={patientId}
          summary={medicalSummary.data}
        />
      </div>

      <VisitHistoryCard
        onOpenNewVisit={() =>
          router.push(`/dashboard/doctor/patients/${patientId}/visits/new`)
        }
        patientId={patientId}
        rows={visitHistory.data}
      />

      <VerificationHistory
        isError={insuranceHistory.isError}
        isLoading={insuranceHistory.isFetching}
        onRetry={() => void insuranceHistory.refetch()}
        patientId={patientId}
        rows={insuranceHistory.data ?? []}
      />
    </div>
  );
}
