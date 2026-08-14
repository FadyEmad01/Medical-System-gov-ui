"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
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
import { Spinner } from "@/components/ui/spinner";
import { Link } from "@/i18n/navigation";
import { isAuthActionError } from "../../../hooks/session-guard";
import { useProfile } from "../../../hooks/use-profile";
import type { ApplicationStatus, TimelineStageDto } from "../../../types";
import {
  useApplicationDetail,
  useCurrentEnrollment,
  useStatus,
} from "../../hooks/use-enrollment";
import {
  deriveTrackingPanel,
  type TrackingPanel,
} from "../../lib/derive-wizard-step";
import type { CategoryDocumentRequirementDto } from "../../types";
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
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const status = statusQuery.data;

  // No application yet — nothing to track.
  if (status == null || status.currentApplicationStatus == null) {
    return <NoApplicationState />;
  }

  const requirements =
    currentEnrollmentQuery.data?.insuranceCategory.documentRequirements
      .filter((requirement) => requirement.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <TrackingHeader
        applicationNumber={status.currentApplicationNumber}
        applicationStatus={status.currentApplicationStatus}
      />
      <TimelineSection stages={status.timeline ?? []} />
      <StatusPanel
        panel={deriveTrackingPanel(status.currentApplicationStatus)}
        applicationId={applicationId}
        detailQuery={detailQuery}
        requirements={requirements}
        patientId={profileQuery.data.patientId}
      />
    </div>
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

function TrackingHeader({
  applicationNumber,
  applicationStatus,
}: {
  applicationNumber: string | undefined;
  applicationStatus: ApplicationStatus;
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
          </div>
          <Badge className={APPLICATION_STATUS_TONE[applicationStatus]}>
            {t(`enrollment.status.${applicationStatus}`)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/** Ordered application timeline; hidden when the API returns no stages. */
function TimelineSection({ stages }: { stages: TimelineStageDto[] }) {
  const t = useTranslations("insurance");
  const locale = useLocale();

  if (stages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tracking.timeline")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-3">
          {stages.map((stage, index) => (
            <li
              key={`${stage.stageName ?? "stage"}-${index}`}
              className="flex items-start gap-2"
            >
              {stage.isComplete ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
              )}
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-sm font-medium">{stage.stageName ?? "—"}</p>
                {stage.timestamp ? (
                  <p className="text-xs text-muted-foreground">
                    {formatIsoDate(stage.timestamp, locale)}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
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
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <p className="text-sm text-muted-foreground">
          {t("tracking.notSubmitted")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/insurance/apply">
              {t("tracking.resume")}
            </Link>
          </Button>
          <CancelDialog applicationId={applicationId} />
        </div>
      </CardContent>
    </Card>
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
      <div className="flex min-h-40 items-center justify-center">
        <Spinner />
      </div>
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
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <p className="text-sm text-muted-foreground">
          {t("tracking.approved")}
        </p>
        <div className="flex">
          <Button asChild>
            <Link href="/dashboard/insurance-card">
              {t("tracking.viewCard")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RejectedPanel({ decisionReason }: { decisionReason: string | null }) {
  const t = useTranslations("insurance");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <p className="text-sm text-muted-foreground">
          {t("tracking.rejected")}
        </p>
        {decisionReason ? (
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground">
              {t("tracking.rejectedReason")}
            </p>
            <p className="text-sm">{decisionReason}</p>
          </div>
        ) : null}
        <div className="flex">
          <Button asChild variant="outline">
            <Link href="/dashboard/insurance">{t("tracking.startNew")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CancelledPanel() {
  const t = useTranslations("insurance");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <p className="text-sm text-muted-foreground">
          {t("tracking.cancelled")}
        </p>
        <div className="flex">
          <Button asChild variant="outline">
            <Link href="/dashboard/insurance">{t("tracking.startNew")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
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
