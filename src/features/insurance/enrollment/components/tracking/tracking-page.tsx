"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import {
  CheckCircle2,
  CircleAlert,
  CircleX,
  FileClock,
  FileSearch,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "@/i18n/navigation";
import { isAuthActionError } from "../../../hooks/session-guard";
import { useProfile } from "../../../hooks/use-profile";
import type { ApplicationStatus, TimelineStageDto } from "../../../types";
import {
  useApplicationDetail,
  useApplications,
  useCurrentEnrollment,
  useStatus,
} from "../../hooks/use-enrollment";
import {
  deriveTrackingPanel,
  type TrackingPanel,
} from "../../lib/derive-wizard-step";
import type {
  ApplicationResponseDto,
  CategoryDocumentRequirementDto,
} from "../../types";
import { CancelDialog } from "./cancel-dialog";
import { WaitingDocumentsSection } from "./waiting-documents";

/** Application status → badge tone built from the semantic status tokens. */
const APPLICATION_STATUS_TONE: Record<ApplicationStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Submitted: "bg-info/10 text-info",
  UnderReview: "bg-info/10 text-info",
  WaitingForDocuments: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-revoked/10 text-revoked",
  Cancelled: "bg-muted text-muted-foreground",
};

/**
 * Maps a tracking load error to an insurance translation key. `unauthorized`
 * (401) means the session is dead; `forbidden` (403) means the user is signed
 * in but lacks permission — both are terminal, but they surface differently.
 */
function errorMessageKey(error: unknown): string {
  if (!isAuthActionError(error)) return "errors.generic";
  if (error.kind === "unauthorized") return "errors.sessionExpired";
  if (error.kind === "forbidden") return "errors.forbidden";
  if (error.kind === "notFound") return "errors.notFound";
  return "errors.generic";
}

/**
 * Whether a status's tracking panel renders application detail data. Only the
 * submitted/under-review (review summary), waiting-documents (reviewer note)
 * and rejected (decision reason) panels read it; draft, approved and cancelled
 * panels never do.
 */
function panelNeedsApplicationDetail(
  status: ApplicationStatus | null | undefined,
): boolean {
  return (
    status === "Submitted" ||
    status === "UnderReview" ||
    status === "WaitingForDocuments" ||
    status === "Rejected"
  );
}

function formatIsoDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
}

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

/**
 * The patient's application history minus the one being tracked above.
 * Hidden entirely when there is nothing to show.
 */
function PastApplicationsSection({
  applications,
  currentApplicationId,
}: {
  applications: ApplicationResponseDto[];
  currentApplicationId: string | null;
}) {
  const t = useTranslations("insurance");
  const locale = useLocale();

  const past = applications.filter(
    (application) => application.id !== currentApplicationId,
  );
  if (past.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tracking.history")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {past.map((application) => (
            <li
              key={application.id}
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-sm font-medium tabular-nums">
                  {t("enrollment.applicationNumber", {
                    number: application.applicationNumber,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatIsoDate(
                    application.submittedAt ?? application.createdAt,
                    locale,
                  )}
                </p>
                {application.decisionReason ? (
                  <p className="text-xs text-muted-foreground">
                    {application.decisionReason}
                  </p>
                ) : null}
              </div>
              <Badge className={APPLICATION_STATUS_TONE[application.status]}>
                {t(`enrollment.status.${application.status}`)}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/** No-application empty state with a CTA back to the landing page. */
function NoApplicationState() {
  const t = useTranslations("insurance");

  return (
    <Empty>
      <EmptyMedia variant="icon">
        <FileSearch />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{t("tracking.noApplication")}</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/dashboard/insurance">{t("tracking.startNew")}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

/** Structural placeholder mirroring the loaded layout (no mid-content spinner). */
function TrackingSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-52" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {Array.from({ length: 4 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows, never reordered
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-6 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TrackingHeader({
  applicationNumber,
  applicationStatus,
  completedStages,
  totalStages,
}: {
  applicationNumber: string | undefined;
  applicationStatus: ApplicationStatus;
  completedStages: number;
  totalStages: number;
}) {
  const t = useTranslations("insurance");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle>{t("tracking.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("enrollment.applicationNumber", {
                number: applicationNumber ?? "—",
              })}
            </p>
            {totalStages > 0 ? (
              <p className="text-xs text-muted-foreground tabular-nums">
                {t("tracking.progress", {
                  done: completedStages,
                  total: totalStages,
                })}
              </p>
            ) : null}
          </div>
          <Badge
            className={`gap-1.5 px-3 py-1 text-sm ${APPLICATION_STATUS_TONE[applicationStatus]}`}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {t(`enrollment.status.${applicationStatus}`)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Connected vertical timeline. Node state encodes progress: filled success
 * for completed stages, a primary ring for the current (first incomplete)
 * stage, hollow for upcoming. Connectors stay muted until their stage
 * completes. The node column uses logical offsets so RTL mirrors correctly.
 */
function TimelineSection({ stages }: { stages: TimelineStageDto[] }) {
  const t = useTranslations("insurance");
  const locale = useLocale();
  const currentStageIndex = stages.findIndex((stage) => !stage.isComplete);

  if (stages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tracking.timeline")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col">
          {stages.map((stage, index) => {
            const isCurrent = index === currentStageIndex;
            return (
              <li
                key={`${stage.stageName ?? "stage"}-${index}`}
                className="relative flex gap-3 pb-6 last:pb-0"
              >
                {index < stages.length - 1 ? (
                  <span
                    aria-hidden
                    className={`absolute bottom-0 start-[11px] top-7 w-0.5 rounded-full ${
                      stage.isComplete ? "bg-success/40" : "bg-border"
                    }`}
                  />
                ) : null}
                <span
                  aria-hidden
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                    stage.isComplete
                      ? "bg-success text-card"
                      : isCurrent
                        ? "border-2 border-primary bg-primary/10"
                        : "border bg-muted/50"
                  }`}
                >
                  {stage.isComplete ? (
                    <CheckCircle2 className="size-4" />
                  ) : isCurrent ? (
                    <span className="size-2 rounded-full bg-primary" />
                  ) : null}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                  <p
                    className={`text-sm ${
                      isCurrent
                        ? "font-semibold text-foreground"
                        : stage.isComplete
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {stage.stageName ?? "—"}
                  </p>
                  {stage.timestamp ? (
                    <p className="text-xs text-muted-foreground">
                      {formatIsoDate(stage.timestamp, locale)}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

/** Renders the status-specific panel for the current application. */
function StatusPanel({
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

function DraftPanel({ applicationId }: { applicationId: string | undefined }) {
  const t = useTranslations("insurance");

  return (
    <Alert className="text-info [&>svg]:text-info">
      <FileClock />
      <AlertTitle>{t("tracking.notSubmitted")}</AlertTitle>
      <div className="col-start-2 mt-2 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/dashboard/insurance/apply">
            {t("tracking.resume")}
          </Link>
        </Button>
        <CancelDialog applicationId={applicationId} />
      </div>
    </Alert>
  );
}

/** View-only application summary for submitted / under-review applications. */
function ReviewSummaryPanel({
  detailQuery,
  applicationId,
}: {
  detailQuery: ReturnType<typeof useApplicationDetail>;
  applicationId: string | undefined;
}) {
  const t = useTranslations("insurance");
  const locale = useLocale();

  if (detailQuery.isPending) {
    return (
      <Card aria-busy="true">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 4 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows, never reordered
              <div key={index} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    );
  }

  const detail = detailQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tracking.details")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <TrackingDetail
            label={t("tracking.submissionChannel")}
            value={
              detail
                ? t(`tracking.submissionChannels.${detail.submissionChannel}`)
                : "—"
            }
          />
          <TrackingDetail
            label={t("tracking.submittedAt")}
            value={
              detail?.submittedAt
                ? formatIsoDate(detail.submittedAt, locale)
                : "—"
            }
          />
          <TrackingDetail
            label={t("tracking.documentCount")}
            value={detail ? `${detail.documentCount}` : "—"}
          />
          <TrackingDetail
            label={t("tracking.dependentCount")}
            value={detail ? `${detail.dependentCount}` : "—"}
          />
        </dl>
        <div className="flex">
          <CancelDialog applicationId={applicationId} />
        </div>
      </CardContent>
    </Card>
  );
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

function ApprovedPanel() {
  const t = useTranslations("insurance");

  return (
    <Alert className="border-success/30 bg-success/10 text-success">
      <CheckCircle2 />
      <AlertTitle>{t("tracking.approved")}</AlertTitle>
      <div className="col-start-2 mt-2 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/dashboard/insurance-card">
            {t("tracking.viewCard")}
          </Link>
        </Button>
      </div>
    </Alert>
  );
}

function RejectedPanel({ decisionReason }: { decisionReason: string | null }) {
  const t = useTranslations("insurance");

  return (
    <Alert className="border-revoked/30 bg-revoked/10 text-revoked">
      <CircleX />
      <AlertTitle>{t("tracking.rejected")}</AlertTitle>
      {decisionReason ? (
        <AlertDescription className="text-revoked/90">
          <span className="font-medium">{t("tracking.rejectedReason")}: </span>
          {decisionReason}
        </AlertDescription>
      ) : null}
      <div className="col-start-2 mt-2 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/insurance">{t("tracking.startNew")}</Link>
        </Button>
      </div>
    </Alert>
  );
}

function CancelledPanel() {
  const t = useTranslations("insurance");

  return (
    <Alert className="text-muted-foreground">
      <CircleAlert />
      <AlertTitle>{t("tracking.cancelled")}</AlertTitle>
      <div className="col-start-2 mt-2 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/insurance">{t("tracking.startNew")}</Link>
        </Button>
      </div>
    </Alert>
  );
}

function TrackingDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
