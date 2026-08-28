"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { useVisit } from "../hooks/use-visit";
import { useUpdateVisitMutation } from "../hooks/use-visit-mutations";
import { canEditVisit } from "../lib/visit-status";
import type { VisitDetailDto } from "../types";
import { AttachmentsPanel } from "./attachments-panel";
import { MedicationsPanel } from "./medications-panel";
import { PendingBackendNotice } from "./pending-backend-notice";
import { VisitStatusBadge } from "./visit-status-badge";
import { VisitStatusDialog } from "./visit-status-dialog";

type NoteDraft = { diagnosis: string; notes: string; requiredTests: string };

/** GET /visits/{id} — the encounter: clinical narrative + medications + attachments. */
export function VisitDetail() {
  const t = useTranslations("doctor");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? arSA : enUS;
  const router = useRouter();
  const params = useParams<{ visitId: string }>();
  const visitId = params.visitId ?? "";
  const query = useVisit(visitId);
  const visit = query.data;
  const [editOpen, setEditOpen] = useState(false);

  if (query.isLoading || query.isPending || !visit) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Card className="py-0">
          <CardHeader className="border-b border-border px-4 py-3">
            <CardTitle className="text-sm font-medium">
              {t("visits.title")}
            </CardTitle>
            <CardDescription className="text-xs font-mono">
              {visitId}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 p-4">
            <PendingBackendNotice />
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
              <ClipboardList className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("visits.pendingBody")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex flex-col gap-2">
        <Button
          className="self-start px-2 text-muted-foreground"
          onClick={() =>
            router.push(`/dashboard/doctor/patients/${visit.patientId}`)
          }
          size="sm"
          type="button"
          variant="ghost"
        >
          <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
          {t("visits.backToChart")}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-medium">
            {format(new Date(visit.visitDate), "PPP", { locale: dateLocale })}
          </h1>
          <span className="text-sm text-muted-foreground">
            {t(`visits.types.${visit.visitType}`)}
          </span>
          <VisitStatusBadge status={visit.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("visits.doctorSeenBy", { doctor: visit.doctorFullName })}
        </p>
      </header>

      <ClinicalNoteCard visit={visit} onEdit={() => setEditOpen(true)} />

      <div className="grid flex-1 gap-4 xl:grid-cols-2">
        <MedicationsPanel visit={visit} />
        <AttachmentsPanel visit={visit} />
      </div>

      <VisitStatusDialog
        patientId={visit.patientId}
        status={visit.status}
        visitId={visit.id}
      />

      {editOpen ? (
        <EditNoteDialog onOpenChange={setEditOpen} visit={visit} />
      ) : null}
    </div>
  );
}

/** PUT /visits/{id} — full replace: cleared fields genuinely delete content (§9). */
function ClinicalNoteCard({
  visit,
  onEdit,
}: {
  visit: VisitDetailDto;
  onEdit: () => void;
}) {
  const t = useTranslations("doctor");
  const editable = canEditVisit(visit.status);

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
        <div>
          <CardTitle className="text-sm font-medium">
            {t("visits.note.title")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("visits.note.hint")}
          </CardDescription>
        </div>
        {editable ? (
          <Button onClick={onEdit} size="sm" type="button" variant="outline">
            {t("visits.note.edit")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4 text-sm">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("visits.fields.diagnosis")}
          </p>
          <p>{visit.diagnosis ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("visits.fields.notes")}
          </p>
          <p className="whitespace-pre-wrap">{visit.notes ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("visits.fields.requiredTests")}
          </p>
          <p>{visit.requiredTests ?? "—"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EditNoteDialog({
  visit,
  onOpenChange,
}: {
  visit: VisitDetailDto;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("doctor");
  const mutation = useUpdateVisitMutation(visit.id, visit.patientId);
  const [draft, setDraft] = useState<NoteDraft>({
    diagnosis: visit.diagnosis ?? "",
    notes: visit.notes ?? "",
    requiredTests: visit.requiredTests ?? "",
  });

  const clearingFilled =
    (visit.diagnosis !== null && draft.diagnosis.trim() === "") ||
    (visit.notes !== null && draft.notes.trim() === "") ||
    (visit.requiredTests !== null && draft.requiredTests.trim() === "");

  return (
    <Dialog onOpenChange={onOpenChange} open>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("visits.note.editTitle")}</DialogTitle>
          <DialogDescription>{t("visits.note.fullReplace")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {(
            [
              ["diagnosis", "visits.fields.diagnosis"],
              ["notes", "visits.fields.notes"],
              ["requiredTests", "visits.fields.requiredTests"],
            ] as const
          ).map(([field, labelKey]) => (
            <div className="flex flex-col gap-1.5" key={field}>
              <Label htmlFor={`note-${field}`}>{t(labelKey)}</Label>
              <Textarea
                id={`note-${field}`}
                onChange={(event) =>
                  setDraft({ ...draft, [field]: event.target.value })
                }
                rows={field === "notes" ? 4 : 2}
                value={draft[field]}
              />
            </div>
          ))}
          {clearingFilled ? (
            <p className="rounded-xl bg-warning/10 p-3 text-xs font-medium text-warning">
              {t("visits.note.clearingWarning")}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate(
                {
                  diagnosis: draft.diagnosis,
                  notes: draft.notes,
                  requiredTests: draft.requiredTests,
                },
                { onSuccess: () => onOpenChange(false) },
              )
            }
            type="button"
          >
            {mutation.isPending
              ? t("visits.note.saving")
              : t("visits.note.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
