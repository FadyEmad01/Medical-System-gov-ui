"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import {
  BadgeCheck,
  Ban,
  ChevronDown,
  CircleAlert,
  CreditCard,
  History,
  KeyRound,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CARD_STATUS_TONE } from "../../../lib/card-status-tone";
import type { CardResponseDto } from "../../../types";
import {
  useCardDetail,
  useCardHistory,
  useReactivateCard,
  useRenewCard,
  useReplaceCard,
  useRevokeCard,
  useRotateCardToken,
  useSuspendCard,
} from "../hooks/use-card-lifecycle";
import {
  type CardAction,
  deriveAllowedCardActions,
} from "../lib/allowed-card-actions";
import { CARD_REASON_MAX } from "../lib/card-reason-validation";
import type { ReplacementReason } from "../types";
import { PatientSnapshot } from "./patient-snapshot";

const REPLACEMENT_REASONS: ReplacementReason[] = [
  "Lost",
  "Damaged",
  "Stolen",
  "Other",
];

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
}

/** Dialog mode: which lifecycle action is collecting input. */
type DialogState =
  | {
      kind: "reason";
      action: Extract<CardAction, "suspend" | "revoke" | "renew">;
    }
  | { kind: "replace" }
  | { kind: "confirm"; action: "reactivate" | "rotate-token" };

/**
 * The Admin card-management screen: one patient's full card history with
 * per-card lifecycle actions and an expandable audit trail per card.
 */
export default function CardsPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const params = useParams<{ patientId: string }>();
  const patientId = Number.parseInt(params.patientId, 10);

  const historyQuery = useCardHistory(
    Number.isFinite(patientId) ? patientId : 0,
  );
  const cards = historyQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PatientSnapshot patientId={Number.isFinite(patientId) ? patientId : 0} />
      <Card>
        <CardHeader>
          <CardTitle>{t("cards.title")}</CardTitle>
          <CardDescription>{t("cards.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {historyQuery.isPending ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              {Array.from({ length: 3 }).map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : historyQuery.isError ? (
            <p className="text-sm text-muted-foreground">
              {t("cards.errors.load")}
            </p>
          ) : cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("cards.errors.none")}
            </p>
          ) : (
            cards.map((card) => (
              <CardRow
                key={card.id}
                card={card}
                locale={locale}
                patientId={patientId}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CardRow({
  card,
  locale,
  patientId,
}: {
  card: CardResponseDto;
  locale: string;
  patientId: number;
}) {
  const t = useTranslations("admin");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [replacementReason, setReplacementReason] =
    useState<ReplacementReason>("Lost");
  const [open, setOpen] = useState(false);

  const suspend = useSuspendCard(patientId, card.id, reason.trim());
  const revoke = useRevokeCard(patientId, card.id, reason.trim());
  const renew = useRenewCard(patientId, card.id, reason.trim());
  const replace = useReplaceCard(patientId, card.id, {
    replacementReason,
    reasonNote: note.trim(),
  });
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
      if (dialog.action === "suspend") suspend.mutate();
      else if (dialog.action === "revoke") revoke.mutate();
      else if (dialog.action === "renew") renew.mutate();
    } else if (dialog.kind === "replace") {
      replace.mutate();
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

  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <div className="rounded-lg border">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="flex items-center gap-2 font-medium tabular-nums">
                {card.cardNumber ?? "—"}
                {card.isLatestCard ? (
                  <Badge variant="outline">
                    <BadgeCheck className="size-3" />
                    {t("cards.latest")}
                  </Badge>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {card.holderFullName ?? "—"}
                {card.dependentPersonId ? ` · ${t("cards.dependentCard")}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("cards.dates", {
                  issued: formatDate(card.issuedAt, locale),
                  expires: formatDate(card.expiresAt, locale),
                })}
                {card.replacementReason
                  ? ` · ${t(`cards.replacementReason.${card.replacementReason}`)}`
                  : ""}
              </p>
              {card.reasonNote ? (
                <p className="text-xs text-muted-foreground">
                  {card.reasonNote}
                </p>
              ) : null}
            </div>
            <Badge className={CARD_STATUS_TONE[card.status]}>
              {t(`cards.status.${card.status}`)}
            </Badge>
          </div>

          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {actions.includes("suspend") ? (
                <Button
                  disabled={pending}
                  onClick={() =>
                    setDialog({ kind: "reason", action: "suspend" })
                  }
                  size="sm"
                  variant="outline"
                >
                  <Ban data-icon="inline-start" />
                  {t("cards.actions.suspend")}
                </Button>
              ) : null}
              {actions.includes("reactivate") ? (
                <Button
                  disabled={pending}
                  onClick={() =>
                    setDialog({ kind: "confirm", action: "reactivate" })
                  }
                  size="sm"
                >
                  <RotateCcw data-icon="inline-start" />
                  {t("cards.actions.reactivate")}
                </Button>
              ) : null}
              {actions.includes("renew") ? (
                <Button
                  disabled={pending}
                  onClick={() => setDialog({ kind: "reason", action: "renew" })}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw data-icon="inline-start" />
                  {t("cards.actions.renew")}
                </Button>
              ) : null}
              {actions.includes("replace") ? (
                <Button
                  disabled={pending}
                  onClick={() => setDialog({ kind: "replace" })}
                  size="sm"
                  variant="outline"
                >
                  <CreditCard data-icon="inline-start" />
                  {t("cards.actions.replace")}
                </Button>
              ) : null}
              {actions.includes("rotate-token") ? (
                <Button
                  disabled={pending}
                  onClick={() =>
                    setDialog({ kind: "confirm", action: "rotate-token" })
                  }
                  size="sm"
                  variant="outline"
                >
                  <KeyRound data-icon="inline-start" />
                  {t("cards.actions.rotateToken")}
                </Button>
              ) : null}
              {actions.includes("revoke") ? (
                <Button
                  disabled={pending}
                  onClick={() =>
                    setDialog({ kind: "reason", action: "revoke" })
                  }
                  size="sm"
                  variant="destructive"
                >
                  <ShieldAlert data-icon="inline-start" />
                  {t("cards.actions.revoke")}
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("cards.terminal", {
                status: t(`cards.status.${card.status}`),
              })}
            </p>
          )}
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
            {detail.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : detail.isError ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleAlert className="size-4" />
                {t("cards.errors.history")}
              </p>
            ) : detail.data && detail.data.statusHistory.length > 0 ? (
              <ol className="flex flex-col">
                {[...detail.data.statusHistory]
                  .reverse()
                  .map((change, index, all) => (
                    <li
                      className="relative flex gap-3 pb-4 last:pb-0"
                      key={change.id}
                    >
                      {index < all.length - 1 ? (
                        <span
                          aria-hidden
                          className="absolute bottom-0 start-[11px] top-6 w-0.5 rounded-full bg-border"
                        />
                      ) : null}
                      <span
                        aria-hidden
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-info/10 text-info"
                      >
                        <History className="size-3.5" />
                      </span>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="text-sm font-medium">
                          {t("cards.change", {
                            from: t(`cards.status.${change.previousStatus}`),
                            to: t(`cards.status.${change.newStatus}`),
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(change.changedAt, locale)}
                        </p>
                        {change.reason ? (
                          <p className="text-xs text-muted-foreground">
                            {change.reason}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("cards.errors.noHistory")}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>

      {/* Reason dialog (suspend / revoke / renew) */}
      <Dialog
        onOpenChange={(isOpen) => setDialog(isOpen ? dialog : null)}
        open={dialog?.kind === "reason"}
      >
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
              onChange={(event) => setReason(event.target.value)}
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
            <Button onClick={() => setDialog(null)} variant="outline">
              {t("actions.cancel")}
            </Button>
            <Button
              disabled={!reasonValid || pending}
              onClick={submit}
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

      {/* Replace dialog */}
      <Dialog
        onOpenChange={(isOpen) => setDialog(isOpen ? dialog : null)}
        open={dialog?.kind === "replace"}
      >
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
                  setReplacementReason(value as ReplacementReason)
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
                onChange={(event) => setNote(event.target.value)}
                value={note}
              />
              <div className="flex justify-end text-xs text-muted-foreground tabular-nums">
                {note.length}/{CARD_REASON_MAX}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDialog(null)} variant="outline">
              {t("actions.cancel")}
            </Button>
            <Button disabled={!noteValid || pending} onClick={submit}>
              {t("cards.actions.replace")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm dialog (reactivate / rotate-token) */}
      <AlertDialog
        onOpenChange={(isOpen) => setDialog(isOpen ? dialog : null)}
        open={dialog?.kind === "confirm"}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                `cards.dialogs.${dialog?.kind === "confirm" ? dialog.action : "reactivate"}.title`,
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `cards.dialogs.${dialog?.kind === "confirm" ? dialog.action : "reactivate"}.description`,
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button disabled={pending} onClick={submit}>
                {t("cards.actions.confirm")}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Collapsible>
  );
}
