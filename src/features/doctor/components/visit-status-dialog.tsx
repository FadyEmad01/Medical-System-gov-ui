"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateVisitStatusMutation } from "../hooks/use-visit-mutations";
import { nextStatuses } from "../lib/visit-status";
import type { VisitStatus } from "../types";

/** PATCH /visits/{id}/status — offers only the valid next states (§6.9). */
export function VisitStatusDialog({
  patientId,
  status,
  visitId,
}: {
  visitId: string;
  patientId?: number;
  status: VisitStatus;
}) {
  const t = useTranslations("doctor");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<VisitStatus | null>(null);
  const mutation = useUpdateVisitStatusMutation(visitId, patientId);
  const options = nextStatuses(status);

  if (options.length === 0) return null;

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <Button onClick={() => setOpen(true)} size="sm" type="button">
        {t("visits.status.change")}
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("visits.status.title")}</DialogTitle>
          <DialogDescription>{t("visits.status.hint")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="visit-status-next">{t("visits.status.next")}</Label>
          <Select
            onValueChange={(value) => setSelected(value as VisitStatus)}
            value={selected ?? undefined}
          >
            <SelectTrigger id="visit-status-next">
              <SelectValue placeholder={t("visits.status.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`visits.statuses.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            disabled={selected === null || mutation.isPending}
            onClick={() => {
              if (selected === null) return;
              mutation.mutate(
                { visitId, status: selected },
                { onSuccess: () => setOpen(false) },
              );
            }}
            type="button"
          >
            {mutation.isPending
              ? t("visits.status.saving")
              : t("visits.status.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
