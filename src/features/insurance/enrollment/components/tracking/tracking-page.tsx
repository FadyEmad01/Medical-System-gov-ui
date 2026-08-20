"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useProfile } from "../../../hooks/use-profile";
import { errorMessageKey } from "../../../lib/error-message-key";
import {
  useApplicationDetail,
  useApplications,
  useCurrentEnrollment,
  useStatus,
} from "../../hooks/use-enrollment";
import { deriveTrackingPanel } from "../../lib/derive-wizard-step";
import { panelNeedsApplicationDetail } from "../../lib/panel-needs-detail";
import { PastApplicationsSection } from "./past-applications-section";
import { StatusPanel } from "./status-panels";
import { TimelineSection } from "./timeline-section";
import {
  NoApplicationState,
  TrackingHeader,
  TrackingSkeleton,
} from "./tracking-chrome";

/**
 * Application tracking — the patient's single source of truth for where their
 * application stands.
 *
 * The patient ID comes from the cached profile (not the current enrollment):
 * terminal applications (Approved, Rejected, Cancelled) may 404 on the current
 * enrollment, while the profile is always cached. The current enrollment is
 * read only for the waiting-documents upload slots' category requirements.
 */
export default function TrackingPage() {
  const t = useTranslations("insurance");
  const profileQuery = useProfile();
  const statusQuery = useStatus(profileQuery.data?.patientId);
  const currentEnrollmentQuery = useCurrentEnrollment();
  // Full history for the past-applications list; secondary data — its failure
  // never blocks the page (the main queries own the error card above).
  const applicationsQuery = useApplications(profileQuery.data?.patientId);

  const applicationId =
    statusQuery.data?.currentApplicationId ??
    currentEnrollmentQuery.data?.applicationId;
  // Fetch detail only when the rendered panel reads it; a disabled query keeps
  // its error out of the loadError chain for draft/approved/cancelled panels.
  const detailQuery = useApplicationDetail(applicationId ?? "", {
    enabled:
      applicationId != null &&
      panelNeedsApplicationDetail(statusQuery.data?.currentApplicationStatus),
  });

  // A dead session clears the identity cache here and lets AuthGuard redirect;
  // other load failures get a retryable error card below. The current
  // enrollment query is deliberately excluded from load errors — it 404s by
  // design for terminal applications, and only the waiting-documents panel
  // reads its data.
  const loadError =
    profileQuery.error ?? statusQuery.error ?? detailQuery.error;
  const isRefetching =
    profileQuery.isRefetching ||
    statusQuery.isRefetching ||
    currentEnrollmentQuery.isRefetching ||
    detailQuery.isRefetching;

  if (loadError) {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>{t("tracking.title")}</AlertTitle>
        <AlertDescription>{t(errorMessageKey(loadError))}</AlertDescription>
        <AlertAction>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRefetching}
            onClick={() => {
              void profileQuery.refetch();
              void statusQuery.refetch();
              void currentEnrollmentQuery.refetch();
              void detailQuery.refetch();
            }}
          >
            {isRefetching && <Spinner data-icon="inline-start" />}
            {t("enrollment.retry")}
          </Button>
        </AlertAction>
      </Alert>
    );
  }

  if (
    profileQuery.isPending ||
    statusQuery.isPending ||
    profileQuery.data == null
  ) {
    return <TrackingSkeleton />;
  }

  const status = statusQuery.data;

  // No application yet — nothing to track, but past applications may exist.
  if (status == null || status.currentApplicationStatus == null) {
    return (
      <div className="flex flex-col gap-4">
        <NoApplicationState />
        <PastApplicationsSection
          applications={applicationsQuery.data ?? []}
          currentApplicationId={null}
        />
      </div>
    );
  }

  const requirements =
    currentEnrollmentQuery.data?.insuranceCategory.documentRequirements
      .filter((requirement) => requirement.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder) ?? [];

  const stages = status.timeline ?? [];
  const completedStages = stages.filter((stage) => stage.isComplete).length;

  return (
    <div className="flex flex-col gap-4">
      <TrackingHeader
        applicationNumber={status.currentApplicationNumber}
        applicationStatus={status.currentApplicationStatus}
        completedStages={completedStages}
        totalStages={stages.length}
      />
      <TimelineSection stages={stages} />
      <StatusPanel
        panel={deriveTrackingPanel(status.currentApplicationStatus)}
        applicationId={applicationId}
        detailQuery={detailQuery}
        requirements={requirements}
        patientId={profileQuery.data.patientId}
      />
      <PastApplicationsSection
        applications={applicationsQuery.data ?? []}
        currentApplicationId={status.currentApplicationId ?? null}
      />
    </div>
  );
}
