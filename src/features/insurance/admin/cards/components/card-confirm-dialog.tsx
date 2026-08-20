"use client";

import { useTranslations } from "next-intl";
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
import type { DialogState } from "./card-page-shared";

type CardConfirmDialogProps = {
  dialog: DialogState | null;
  pending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: () => void;
};

/** Confirm dialog for reactivate / rotate-token lifecycle actions. */
export function CardConfirmDialog({
  dialog,
  pending,
  onOpenChange,
  onSubmit,
}: CardConfirmDialogProps) {
  const t = useTranslations("admin");

  return (
    <AlertDialog onOpenChange={onOpenChange} open={dialog?.kind === "confirm"}>
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
            <Button disabled={pending} onClick={onSubmit}>
              {t("cards.actions.confirm")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
