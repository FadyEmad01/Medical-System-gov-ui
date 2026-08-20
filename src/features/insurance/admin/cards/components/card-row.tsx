"use client";

import { ChevronDown, History } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CardResponseDto } from "../../../types";
import {
  useCardDetail,
  useReactivateCard,
  useRenewCard,
  useReplaceCard,
  useRevokeCard,
  useRotateCardToken,
  useSuspendCard,
} from "../hooks/use-card-lifecycle";
import { deriveAllowedCardActions } from "../lib/allowed-card-actions";
import { CARD_REASON_MAX } from "../lib/card-reason-validation";
import type { ReplacementReason } from "../types";
import { CardConfirmDialog } from "./card-confirm-dialog";
import { CardHistoryList } from "./card-history-list";
import { type DialogState } from "./card-page-shared";
import { CardReasonDialog } from "./card-reason-dialog";
import { CardReplaceDialog } from "./card-replace-dialog";
import { CardRowActions } from "./card-row-actions";
import { CardRowHeader } from "./card-row-header";

type CardRowProps = {
  card: CardResponseDto;
  locale: string;
  patientId: number;
};

/**
 * One card in the patient's history: status, lifecycle actions, audit trail,
 * and the dialogs that collect reasons / confirmations for those actions.
 */
export function CardRow({ card, locale, patientId }: CardRowProps) {
  const t = useTranslations("admin");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [replacementReason, setReplacementReason] =
    useState<ReplacementReason>("Lost");
  const [open, setOpen] = useState(false);

  const suspend = useSuspendCard(patientId, card.id);
  const revoke = useRevokeCard(patientId, card.id);
  const renew = useRenewCard(patientId, card.id);
  const replace = useReplaceCard(patientId, card.id);
  const reactivate = useReactivateCard(patientId, card.id);
  const rotate = useRotateCardToken(patientId, card.id);
  const pending =
    suspend.isPending ||
    revoke.isPending ||
    renew.isPending ||
    replace.isPending ||
    reactivate.isPending ||
    rotate.isPending;

  const actions = deriveAllowedCardActions(card.status);
  const detail = useCardDetail(card.id, open);

  const submit = () => {
    if (!dialog) return;
    if (dialog.kind === "reason") {
      const trimmed = reason.trim();
      if (dialog.action === "suspend") suspend.mutate(trimmed);
      else if (dialog.action === "revoke") revoke.mutate(trimmed);
      else if (dialog.action === "renew") renew.mutate(trimmed);
    } else if (dialog.kind === "replace") {
      replace.mutate({
        replacementReason,
        reasonNote: note.trim(),
      });
    } else if (dialog.action === "reactivate") reactivate.mutate();
    else rotate.mutate();
    setDialog(null);
    setReason("");
    setNote("");
  };

  const reasonRequired = dialog?.kind === "reason" && dialog.action !== "renew";
  const reasonValid =
    reason.length <= CARD_REASON_MAX &&
    (!reasonRequired || reason.trim().length >= 1);
  const noteValid = note.length <= CARD_REASON_MAX;

  const handleDialogOpenChange = (isOpen: boolean) =>
    setDialog(isOpen ? dialog : null);

  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <div className="rounded-lg border">
        <div className="flex flex-col gap-3 p-4">
          <CardRowHeader card={card} locale={locale} />
          <CardRowActions
            actions={actions}
            onOpenDialog={setDialog}
            pending={pending}
            status={card.status}
          />
        </div>

        <CollapsibleTrigger asChild>
          <Button
            className="w-full rounded-none border-x-0 border-b-0"
            variant="ghost"
          >
            <ChevronDown className={open ? "rotate-180" : undefined} />
            <History className="rtl:ml-0" />
            {t("cards.historyToggle")}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t p-4">
            <CardHistoryList
              detail={detail.data}
              isError={detail.isError}
              isPending={detail.isPending}
              locale={locale}
            />
          </div>
        </CollapsibleContent>
      </div>

      <CardReasonDialog
        dialog={dialog}
        onCancel={() => setDialog(null)}
        onOpenChange={handleDialogOpenChange}
        onReasonChange={setReason}
        onSubmit={submit}
        pending={pending}
        reason={reason}
        reasonRequired={reasonRequired}
        reasonValid={reasonValid}
      />

      <CardReplaceDialog
        note={note}
        noteValid={noteValid}
        onCancel={() => setDialog(null)}
        onNoteChange={setNote}
        onOpenChange={handleDialogOpenChange}
        onReplacementReasonChange={setReplacementReason}
        onSubmit={submit}
        open={dialog?.kind === "replace"}
        pending={pending}
        replacementReason={replacementReason}
      />

      <CardConfirmDialog
        dialog={dialog}
        onOpenChange={handleDialogOpenChange}
        onSubmit={submit}
        pending={pending}
      />
    </Collapsible>
  );
}
