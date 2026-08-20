"use client";

import { useState } from "react";
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
import {
  ApprovedStatusBanner,
  ReviewActionButtons,
  TerminalStatusSummary,
} from "./action-bar-controls";
import { DecisionDialog, type DecisionKind } from "./decision-dialog";
import { IssueCardsDialog } from "./issue-cards-dialog";

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
      <TerminalStatusSummary
        status={status}
        decisionReason={decisionReason}
      />
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        {status === "Approved" ? (
          <ApprovedStatusBanner
            status={status}
            decisionReason={decisionReason}
          />
        ) : null}

        <ReviewActionButtons
          actions={actions}
          pending={pending}
          onDecision={setDialog}
          onBackToReview={() =>
            back.mutate({ citizenVisibleReason: "", internalNotes: "" })
          }
          onIssueCards={() => setIssueOpen(true)}
        />
      </CardContent>

      <DecisionDialog
        isPending={pending}
        kind={dialog ?? "approve"}
        onOpenChange={(open) => setDialog(open ? dialog : null)}
        onSubmit={submit}
        open={dialog !== null}
      />

      <IssueCardsDialog
        isPending={pending}
        onConfirm={() => issue.mutate()}
        onOpenChange={setIssueOpen}
        open={issueOpen}
      />
    </Card>
  );
}
