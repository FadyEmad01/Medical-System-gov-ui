"use client";

import {
  CheckCircle2,
  CircleAlert,
  CircleX,
  FileClock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CancelDialog } from "./cancel-dialog";

export function DraftPanel({
  applicationId,
}: {
  applicationId: string | undefined;
}) {
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

export function ApprovedPanel() {
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

export function RejectedPanel({
  decisionReason,
}: {
  decisionReason: string | null;
}) {
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

export function CancelledPanel() {
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
