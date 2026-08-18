"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CITIZEN_REASON_MAX,
  INTERNAL_NOTES_MAX,
} from "../../lib/decision-validation";
import type { DecisionInput } from "../../types";

export type DecisionKind = "approve" | "reject" | "request-documents";

/**
 * Shared dialog for the three reason-carrying decisions. Client-side rules
 * mirror the server boundary: reason 1–1000 (required for reject/request,
 * optional for approve), notes ≤2000. Submit stays disabled while invalid or
 * in-flight — one click, one decision (no idempotency keys).
 */
export function DecisionDialog({
  kind,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  kind: DecisionKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: DecisionInput) => void;
  isPending: boolean;
}) {
  const t = useTranslations("admin");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setNotes("");
    }
  }, [open]);

  const requireReason = kind !== "approve";
  const reasonValid = requireReason
    ? reason.trim().length >= 1 && reason.length <= CITIZEN_REASON_MAX
    : reason.length <= CITIZEN_REASON_MAX;
  const notesValid = notes.length <= INTERNAL_NOTES_MAX;
  const canSubmit = reasonValid && notesValid && !isPending;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(`actions.${kind}.title`)}</DialogTitle>
          <DialogDescription>
            {t(`actions.${kind}.description`)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="decision-reason">
              {t("actions.fields.citizenReason")}
              {requireReason ? (
                <span aria-hidden className="text-revoked">
                  {" "}
                  *
                </span>
              ) : null}
            </label>
            <Textarea
              aria-invalid={!reasonValid || undefined}
              id="decision-reason"
              maxLength={CITIZEN_REASON_MAX + 1}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("actions.fields.citizenReasonPlaceholder")}
              value={reason}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("actions.fields.citizenReasonHint")}</span>
              <span className="tabular-nums">
                {reason.length}/{CITIZEN_REASON_MAX}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="decision-notes">
              {t("actions.fields.internalNotes")}
            </label>
            <Textarea
              aria-invalid={!notesValid || undefined}
              id="decision-notes"
              maxLength={INTERNAL_NOTES_MAX + 1}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t("actions.fields.internalNotesPlaceholder")}
              value={notes}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("actions.fields.internalNotesHint")}</span>
              <span className="tabular-nums">
                {notes.length}/{INTERNAL_NOTES_MAX}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            {t("actions.cancel")}
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                citizenVisibleReason: reason.trim(),
                internalNotes: notes.trim(),
              })
            }
            variant={kind === "reject" ? "destructive" : "default"}
          >
            {t(`actions.${kind}.confirm`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
