"use client";

import { Ban } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCancelApplication } from "../../hooks/use-enrollment";

/**
 * Confirmation dialog for cancelling a non-terminal application
 * (PATCH .../cancel). The mutation is fire-and-forget here: toasts and cache
 * invalidation live in the hook, and the panel re-renders with the new
 * "cancelled" status once the invalidated queries refetch. The trigger is only
 * rendered by the tracking panels for non-terminal statuses.
 */
export function CancelDialog({
  applicationId,
}: {
  applicationId: string | undefined;
}) {
  const t = useTranslations("insurance");
  const cancelApplication = useCancelApplication();

  // No application id — nothing to cancel.
  if (!applicationId) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline">
          <Ban data-icon="inline-start" />
          {t("tracking.cancel")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Ban />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {t("tracking.cancelDialog.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("tracking.cancelDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("tracking.cancelDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={cancelApplication.isPending}
            onClick={() => {
              cancelApplication.mutate(applicationId);
            }}
          >
            {cancelApplication.isPending ? (
              <Spinner data-icon="inline-start" />
            ) : null}
            {cancelApplication.isPending
              ? t("tracking.cancelling")
              : t("tracking.cancelDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
