"use client";

import { Pill } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddMedicationsMutation } from "../hooks/use-visit-mutations";
import { parseMedicationRows } from "../lib/medication-rows";
import { canAddMedication } from "../lib/visit-status";
import type { VisitDetailDto } from "../types";

/** POST /visits/{id}/medications — blocked once the visit is closed (§9 banner rule). */
export function MedicationsPanel({ visit }: { visit: VisitDetailDto }) {
  const t = useTranslations("doctor");
  const mutation = useAddMedicationsMutation(visit.id);
  const [open, setOpen] = useState(false);
  const [row, setRow] = useState({
    medicineName: "",
    dosage: "",
    frequency: "",
    duration: "",
  });
  const [rowError, setRowError] = useState<string | null>(null);

  const closed = !canAddMedication(visit.status);

  const onAdd = () => {
    const parsed = parseMedicationRows([row]);
    if (!parsed.ok) {
      setRowError(t("visits.errors.incompleteRow"));
      return;
    }
    setRowError(null);
    mutation.mutate(
      { visitId: visit.id, medications: parsed.rows },
      {
        onSuccess: () => {
          setRow({ medicineName: "", dosage: "", frequency: "", duration: "" });
          setOpen(false);
        },
      },
    );
  };

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
        <div>
          <CardTitle className="text-sm font-medium">
            {t("medications.title")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("medications.count", { count: visit.medications.length })}
          </CardDescription>
        </div>
        {!closed ? (
          <Button
            onClick={() => setOpen((value) => !value)}
            size="sm"
            type="button"
            variant="outline"
          >
            {t("medications.add")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4">
        {closed ? (
          <div className="rounded-xl bg-warning/10 p-3 text-xs font-medium text-warning">
            {t("medications.closedBanner")}
          </div>
        ) : null}

        {open && !closed ? (
          <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="med-name">
                  {t("medications.fields.medicineName")}
                </Label>
                <Input
                  id="med-name"
                  onChange={(event) =>
                    setRow({ ...row, medicineName: event.target.value })
                  }
                  value={row.medicineName}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="med-dosage">
                  {t("medications.fields.dosage")}
                </Label>
                <Input
                  id="med-dosage"
                  onChange={(event) =>
                    setRow({ ...row, dosage: event.target.value })
                  }
                  value={row.dosage}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="med-frequency">
                  {t("medications.fields.frequency")}
                </Label>
                <Input
                  id="med-frequency"
                  onChange={(event) =>
                    setRow({ ...row, frequency: event.target.value })
                  }
                  value={row.frequency}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="med-duration">
                  {t("medications.fields.duration")}
                </Label>
                <Input
                  id="med-duration"
                  onChange={(event) =>
                    setRow({ ...row, duration: event.target.value })
                  }
                  value={row.duration}
                />
              </div>
            </div>
            {rowError ? (
              <p className="text-xs text-destructive">{rowError}</p>
            ) : null}
            <div className="flex gap-2">
              <Button
                disabled={mutation.isPending}
                onClick={onAdd}
                size="sm"
                type="button"
              >
                {mutation.isPending
                  ? t("medications.saving")
                  : t("medications.saveRow")}
              </Button>
              <Button
                onClick={() => setOpen(false)}
                size="sm"
                type="button"
                variant="ghost"
              >
                {t("visits.new.cancel")}
              </Button>
            </div>
          </div>
        ) : null}

        {visit.medications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Pill className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("medications.empty")}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {visit.medications.map((medication) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted p-3"
                key={medication.id}
              >
                <div>
                  <p className="text-sm font-medium">
                    {medication.medicineName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {medication.dosage} · {medication.frequency} ·{" "}
                    {medication.duration}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
