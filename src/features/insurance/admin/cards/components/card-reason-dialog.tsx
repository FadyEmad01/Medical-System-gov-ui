"use client";

import { useTranslations } from "next-intl";
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
import { CARD_REASON_MAX } from "../lib/card-reason-validation";
import type { DialogState } from "./card-page-shared";

type CardReasonDialogProps = {
  dialog: DialogState | null;
  reason: string;
  reasonRequired: boolean;
  reasonValid: boolean;
  pending: boolean;
  onReasonChange: (value: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

/** Reason dialog for suspend / revoke / renew lifecycle actions. */
export function CardReasonDialog({
  dialog,
  reason,
  reasonRequired,
  reasonValid,
  pending,
  onReasonChange,
  onOpenChange,
  onCancel,
  onSubmit,
}: CardReasonDialogProps) {
  const t = useTranslations("admin");

  return (
    <Dialog onOpenChange={onOpenChange} open={dialog?.kind === "reason"}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t(
              `cards.dialogs.${dialog?.kind === "reason" ? dialog.action : "renew"}.title`,
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              `cards.dialogs.${dialog?.kind === "reason" ? dialog.action : "renew"}.description`,
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="card-reason">
            {t("cards.dialogs.reason")}
            {reasonRequired ? (
              <span aria-hidden className="text-revoked">
                {" "}
                *
              </span>
            ) : null}
          </label>
          <Textarea
            id="card-reason"
            maxLength={CARD_REASON_MAX + 1}
            onChange={(event) => onReasonChange(event.target.value)}
            value={reason}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("cards.dialogs.reasonHint")}</span>
            <span className="tabular-nums">
              {reason.length}/{CARD_REASON_MAX}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onCancel} variant="outline">
            {t("actions.cancel")}
          </Button>
          <Button
            disabled={!reasonValid || pending}
            onClick={onSubmit}
            variant={
              dialog?.kind === "reason" && dialog.action === "revoke"
                ? "destructive"
                : "default"
            }
          >
            {t(
              `cards.actions.${dialog?.kind === "reason" ? dialog.action : "renew"}`,
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
