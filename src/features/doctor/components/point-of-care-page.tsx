"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  useCoverageSnapshot,
  useVerificationHistory,
} from "../hooks/use-point-of-care";
import { parsePatientId } from "@/features/insurance/lib/parse-patient-id";
import { CoverageSnapshot } from "./coverage-snapshot";
import { PatientStrip } from "./patient-strip";
import { RecordVerificationPanel } from "./record-verification-panel";
import { ScanCardPanel } from "./scan-card-panel";
import { VerificationHistory } from "./verification-history";

/**
 * Variant A clinical desk: patient strip + scan · snapshot · record columns
 * + verification history. Bound to doctor-swagger read/write endpoints only.
 */
export function PointOfCarePage() {
  const t = useTranslations("doctor");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = searchParams.get("patientId") ?? "";
  const [draftId, setDraftId] = useState(initial);
  const [loadedPatientId, setLoadedPatientId] = useState<number | null>(() =>
    parsePatientId(initial),
  );

  const snapshot = useCoverageSnapshot(loadedPatientId);
  const history = useVerificationHistory(loadedPatientId);

  const onLoad = useCallback(() => {
    const id = parsePatientId(draftId);
    setLoadedPatientId(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id === null) {
      params.delete("patientId");
    } else {
      params.set("patientId", String(id));
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [draftId, pathname, router, searchParams]);

  const isLoading =
    loadedPatientId !== null &&
    (snapshot.eligibility.isFetching ||
      snapshot.current.isFetching ||
      snapshot.latest.isFetching);

  const snapshotError =
    snapshot.eligibility.isError ||
    snapshot.current.isError ||
    snapshot.latest.isError;

  const onRetrySnapshot = useCallback(() => {
    void snapshot.eligibility.refetch();
    void snapshot.current.refetch();
    void snapshot.latest.refetch();
  }, [snapshot.current, snapshot.eligibility, snapshot.latest]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-medium">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </header>

      <PatientStrip
        current={snapshot.current.data}
        draftId={draftId}
        eligibility={snapshot.eligibility.data}
        isLoading={isLoading}
        loadedPatientId={loadedPatientId}
        onDraftChange={setDraftId}
        onLoad={onLoad}
      />

      <div className="grid flex-1 gap-4 xl:grid-cols-3">
        <ScanCardPanel />
        <CoverageSnapshot
          current={snapshot.current.data}
          eligibility={snapshot.eligibility.data}
          isError={snapshotError}
          isLoading={isLoading}
          latest={snapshot.latest.data}
          onRetry={onRetrySnapshot}
          patientId={loadedPatientId}
        />
        <RecordVerificationPanel patientId={loadedPatientId} />
      </div>

      <VerificationHistory
        isError={history.isError}
        isLoading={history.isFetching}
        onRetry={() => void history.refetch()}
        patientId={loadedPatientId}
        rows={history.data ?? []}
      />
    </div>
  );
}
