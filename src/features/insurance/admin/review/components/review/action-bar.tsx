"use client";

import {
  CheckCircle2,
  CircleX,
  CreditCard,
  FileClock,
  Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ApplicationStatus } from "../../../../types";
import { useIssueCards } from "../../../cards/hooks/use-card-lifecycle";
import {
  useApproveApplication,
  useBackToReview,
  useRejectApplication,
  useRequestDocuments,
} from "../../hooks/use-review-actions";
import { deriveAllowedActions } from "../../lib/allowed-actions";
import type { DecisionInput } from "../../types";
import { DecisionDialog, type DecisionKind } from "./decision-dialog";

/**
 * The review action bar. Always re-derived from the (fresh) status — after a
 * decision or a 409 the parent invalidates/refetches the bundle and this bar
 * re-renders with the new truth. Terminal statuses render a summary instead
 * of dead buttons. Approved keeps a manual Issue-cards fallback.
 */
export function ReviewActionBar({
  applicationId,
  patientId,
  status,
  decisionReason,
}: {
  applicationId: string;
  patientId: number;
  status: ApplicationStatus;
  decisionReason: string | null;
}) {
  const t = useTranslations("admin");
  const [dialog, setDialog] = useState<DecisionKind | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);

  const approve = useApproveApplication(applicationId);
  const reject = useRejectApplication(applicationId);
  const request = useRequestDocuments(applicationId);
  const back = useBackToReview(applicationId);
  const issue = useIssueCards(applicationId, patientId);

  const actions = deriveAllowedActions(status);
  const pending =
    approve.isPending ||
    reject.isPending ||
    request.isPending ||
    back.isPending ||
    issue.isPending;

  const submit = (input: DecisionInput) => {
    if (dialog === "approve") approve.mutate(input);
    else if (dialog === "reject") reject.mutate(input);
    else if (dialog === "request-documents") request.mutate(input);
    setDialog(null);
  };

  if (actions.length === 0) {
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

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        {status === "Approved" ? (
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
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {actions.includes("approve") ? (
            <Button disabled={pending} onClick={() => setDialog("approve")}>
              <CheckCircle2 data-icon="inline-start" />
              {t("actions.approve.label")}
            </Button>
          ) : null}
          {actions.includes("reject") ? (
            <Button
              disabled={pending}
              onClick={() => setDialog("reject")}
              variant="destructive"
            >
              <CircleX data-icon="inline-start" />
              {t("actions.reject.label")}
            </Button>
          ) : null}
          {actions.includes("request-documents") ? (
            <Button
              disabled={pending}
              onClick={() => setDialog("request-documents")}
              variant="outline"
            >
              <FileClock data-icon="inline-start" />
              {t("actions.request-documents.label")}
            </Button>
          ) : null}
          {actions.includes("back-to-review") ? (
            <Button
              disabled={pending}
              onClick={() =>
                back.mutate({ citizenVisibleReason: "", internalNotes: "" })
              }
            >
              <Undo2 data-icon="inline-start" />
              {t("actions.back-to-review.label")}
            </Button>
          ) : null}
          {actions.includes("issue-cards") ? (
            <Button
              disabled={pending}
              onClick={() => setIssueOpen(true)}
              variant="outline"
            >
              <CreditCard data-icon="inline-start" />
              {t("actions.issue.label")}
            </Button>
          ) : null}
        </div>
      </CardContent>

      <DecisionDialog
        isPending={pending}
        kind={dialog ?? "approve"}
        onOpenChange={(open) => setDialog(open ? dialog : null)}
        onSubmit={submit}
        open={dialog !== null}
      />

      <AlertDialog onOpenChange={setIssueOpen} open={issueOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("actions.issue.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("actions.issue.confirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                disabled={pending}
                onClick={() => {
                  issue.mutate();
                  setIssueOpen(false);
                }}
              >
                {t("actions.issue.label")}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
