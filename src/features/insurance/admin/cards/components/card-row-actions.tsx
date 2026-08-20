"use client";

import {
  Ban,
  CreditCard,
  KeyRound,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { CardStatus } from "../../../types";
import type { CardAction } from "../lib/allowed-card-actions";
import type { DialogState } from "./card-page-shared";

type CardRowActionsProps = {
  actions: CardAction[];
  pending: boolean;
  status: CardStatus;
  onOpenDialog: (dialog: DialogState) => void;
};

/** Lifecycle action buttons derived from `deriveAllowedCardActions`. */
export function CardRowActions({
  actions,
  pending,
  status,
  onOpenDialog,
}: CardRowActionsProps) {
  const t = useTranslations("admin");

  if (actions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("cards.terminal", {
          status: t(`cards.status.${status}`),
        })}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.includes("suspend") ? (
        <Button
          disabled={pending}
          onClick={() => onOpenDialog({ kind: "reason", action: "suspend" })}
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
            onOpenDialog({ kind: "confirm", action: "reactivate" })
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
          onClick={() => onOpenDialog({ kind: "reason", action: "renew" })}
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
          onClick={() => onOpenDialog({ kind: "replace" })}
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
            onOpenDialog({ kind: "confirm", action: "rotate-token" })
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
          onClick={() => onOpenDialog({ kind: "reason", action: "revoke" })}
          size="sm"
          variant="destructive"
        >
          <ShieldAlert data-icon="inline-start" />
          {t("cards.actions.revoke")}
        </Button>
      ) : null}
    </div>
  );
}
