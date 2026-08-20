"use client";

import {
  CheckCircle2,
  CircleX,
  CreditCard,
  FileClock,
  Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ApplicationStatus } from "../../../../types";
import type { ReviewAction } from "../../lib/allowed-actions";
import type { DecisionKind } from "./decision-dialog";

/** Terminal-status summary when no actions remain. */
export function TerminalStatusSummary({
  status,
  decisionReason,
}: {
  status: ApplicationStatus;
  decisionReason: string | null;
}) {
  const t = useTranslations("admin");

  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-4">
        <p className="text-sm font-medium">
          {t("actions.terminal.title", {
            status: t(`statuses.${status}`),
          })}
        </p>
        {decisionReason ? (
          <p className="text-sm text-muted-foreground">{decisionReason}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Approved-status banner shown above the issue-cards fallback. */
export function ApprovedStatusBanner({
  status,
  decisionReason,
}: {
  status: ApplicationStatus;
  decisionReason: string | null;
}) {
  const t = useTranslations("admin");

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium">
        {t("actions.terminal.title", {
          status: t(`statuses.${status}`),
        })}
      </p>
      {decisionReason ? (
        <p className="text-sm text-muted-foreground">{decisionReason}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {t("actions.issue.description")}
      </p>
    </div>
  );
}

/** Action button group for the review action bar. */
export function ReviewActionButtons({
  actions,
  pending,
  onDecision,
  onBackToReview,
  onIssueCards,
}: {
  actions: ReviewAction[];
  pending: boolean;
  onDecision: (kind: DecisionKind) => void;
  onBackToReview: () => void;
  onIssueCards: () => void;
}) {
  const t = useTranslations("admin");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.includes("approve") ? (
        <Button disabled={pending} onClick={() => onDecision("approve")}>
          <CheckCircle2 data-icon="inline-start" />
          {t("actions.approve.label")}
        </Button>
      ) : null}
      {actions.includes("reject") ? (
        <Button
          disabled={pending}
          onClick={() => onDecision("reject")}
          variant="destructive"
        >
          <CircleX data-icon="inline-start" />
          {t("actions.reject.label")}
        </Button>
      ) : null}
      {actions.includes("request-documents") ? (
        <Button
          disabled={pending}
          onClick={() => onDecision("request-documents")}
          variant="outline"
        >
          <FileClock data-icon="inline-start" />
          {t("actions.request-documents.label")}
        </Button>
      ) : null}
      {actions.includes("back-to-review") ? (
        <Button disabled={pending} onClick={onBackToReview}>
          <Undo2 data-icon="inline-start" />
          {t("actions.back-to-review.label")}
        </Button>
      ) : null}
      {actions.includes("issue-cards") ? (
        <Button disabled={pending} onClick={onIssueCards} variant="outline">
          <CreditCard data-icon="inline-start" />
          {t("actions.issue.label")}
        </Button>
      ) : null}
    </div>
  );
}
