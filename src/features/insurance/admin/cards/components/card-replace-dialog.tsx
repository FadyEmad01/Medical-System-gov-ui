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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CARD_REASON_MAX } from "../lib/card-reason-validation";
import type { ReplacementReason } from "../types";
import { REPLACEMENT_REASONS } from "./card-page-shared";

type CardReplaceDialogProps = {
  open: boolean;
  note: string;
  noteValid: boolean;
  pending: boolean;
  replacementReason: ReplacementReason;
  onNoteChange: (value: string) => void;
  onReplacementReasonChange: (value: ReplacementReason) => void;
  onOpenChange: (isOpen: boolean) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

/** Replace-card dialog: replacement reason select + optional note. */
export function CardReplaceDialog({
  open,
  note,
  noteValid,
  pending,
  replacementReason,
  onNoteChange,
  onReplacementReasonChange,
  onOpenChange,
  onCancel,
  onSubmit,
}: CardReplaceDialogProps) {
  const t = useTranslations("admin");

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("cards.dialogs.replace.title")}</DialogTitle>
          <DialogDescription>
            {t("cards.dialogs.replace.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium"
              htmlFor="replacement-reason"
            >
              {t("cards.dialogs.replace.reason")}
            </label>
            <Select
              onValueChange={(value) =>
                onReplacementReasonChange(value as ReplacementReason)
              }
              value={replacementReason}
            >
              <SelectTrigger id="replacement-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPLACEMENT_REASONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`cards.replacementReason.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="replacement-note">
              {t("cards.dialogs.replace.note")}
            </label>
            <Textarea
              id="replacement-note"
              maxLength={CARD_REASON_MAX + 1}
              onChange={(event) => onNoteChange(event.target.value)}
              value={note}
            />
            <div className="flex justify-end text-xs text-muted-foreground tabular-nums">
              {note.length}/{CARD_REASON_MAX}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onCancel} variant="outline">
            {t("actions.cancel")}
          </Button>
          <Button disabled={!noteValid || pending} onClick={onSubmit}>
            {t("cards.actions.replace")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
