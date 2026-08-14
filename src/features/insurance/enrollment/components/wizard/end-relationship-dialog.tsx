"use client";

import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEndDependent } from "../../hooks/use-enrollment";
import type { DependentResponseDto } from "../../types";

/**
 * Confirmation dialog for removing a dependent (PATCH .../end). The mutation
 * is fire-and-forget here: toasts and cache invalidation live in the hook,
 * and the dialog closes immediately.
 */
export function EndRelationshipDialog({
  dependent,
  onOpenChange,
}: {
  dependent: DependentResponseDto | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("insurance");
  const endDependent = useEndDependent();

  return (
    <AlertDialog open={dependent !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>{t("dependents.endDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("dependents.endDialog.description", {
              name: dependent?.fullName ?? "—",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("dependents.endDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={endDependent.isPending}
            onClick={() => {
              if (!dependent) return;
              endDependent.mutate(dependent.relationshipId);
            }}
          >
            {t("dependents.endDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
