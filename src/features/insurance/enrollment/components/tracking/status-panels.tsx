"use client";

import { FileClock } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import type { TrackingPanel } from "../../lib/derive-wizard-step";
import type { CategoryDocumentRequirementDto } from "../../types";
import { useApplicationDetail } from "../../hooks/use-enrollment";
import { CancelDialog } from "./cancel-dialog";
import {
  ApprovedPanel,
  CancelledPanel,
  DraftPanel,
  RejectedPanel,
} from "./status-outcome-panels";
import { ReviewSummaryPanel } from "./status-review-panel";
import { WaitingDocumentsSection } from "./waiting-documents";

/** Renders the status-specific panel for the current application. */
export function StatusPanel({
  panel,
  applicationId,
  detailQuery,
  requirements,
  patientId,
}: {
  panel: TrackingPanel;
  applicationId: string | undefined;
  detailQuery: ReturnType<typeof useApplicationDetail>;
  requirements: CategoryDocumentRequirementDto[];
  patientId: number;
}) {
  switch (panel) {
    case "draft":
      return <DraftPanel applicationId={applicationId} />;
    case "submitted":
    case "under-review":
      return (
        <ReviewSummaryPanel
          detailQuery={detailQuery}
          applicationId={applicationId}
        />
      );
    case "waiting-documents":
      return (
        <WaitingForDocumentsPanel
          detailQuery={detailQuery}
          applicationId={applicationId}
          requirements={requirements}
          patientId={patientId}
        />
      );
    case "approved":
      return <ApprovedPanel />;
    case "rejected":
      return (
        <RejectedPanel
          decisionReason={detailQuery.data?.decisionReason ?? null}
        />
      );
    case "cancelled":
      return <CancelledPanel />;
  }
}

/** Waiting-for-documents: reviewer note + upload slots for missing files. */
function WaitingForDocumentsPanel({
  detailQuery,
  applicationId,
  requirements,
  patientId,
}: {
  detailQuery: ReturnType<typeof useApplicationDetail>;
  applicationId: string | undefined;
  requirements: CategoryDocumentRequirementDto[];
  patientId: number;
}) {
  const t = useTranslations("insurance");
  const reason =
    detailQuery.data?.reviewHistory[0]?.citizenVisibleReason ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <FileClock />
        <AlertTitle>{t("tracking.waitingDocuments")}</AlertTitle>
        {reason ? <AlertDescription>{reason}</AlertDescription> : null}
      </Alert>

      {requirements.length > 0 ? (
        <WaitingDocumentsSection
          patientId={patientId}
          requirements={requirements}
        />
      ) : null}

      <div className="flex">
        <CancelDialog applicationId={applicationId} />
      </div>
    </div>
  );
}
