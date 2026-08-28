"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/features/auth/hooks/use-me";
import { parsePatientId } from "@/features/insurance/lib/parse-patient-id";
import { useCreateVisitMutation } from "../hooks/use-visit-mutations";
import { VISIT_TYPES } from "../lib/constants";
import { parseMedicationRows } from "../lib/medication-rows";
import { type VisitFormData, visitFormSchema } from "../validation/visit-form";
import { PendingBackendNotice } from "./pending-backend-notice";

const EMPTY_ROW = {
  medicineName: "",
  dosage: "",
  frequency: "",
  duration: "",
};

/** POST /visits — single-page form with an optional repeating group (§6.8, never a wizard). */
export function NewVisitForm() {
  const t = useTranslations("doctor");
  const router = useRouter();
  const params = useParams<{ patientId: string }>();
  const patientId = parsePatientId(params.patientId ?? "");
  const doctorId = useMe().data?.userId ?? 0;
  const mutation = useCreateVisitMutation(patientId ?? 0);

  const form = useForm<VisitFormData>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      visitDate: format(new Date(), "yyyy-MM-dd"),
      visitType: "Consultation",
      diagnosis: "",
      notes: "",
      requiredTests: "",
      medications: [{ ...EMPTY_ROW }],
    },
  });
  const medicationArray = useFieldArray({
    control: form.control,
    name: "medications",
  });

  if (patientId === null) {
    return (
      <p className="text-sm text-muted-foreground">{t("errors.notFound")}</p>
    );
  }

  const onSubmit = form.handleSubmit((values) => {
    const rows = parseMedicationRows(values.medications);
    if (!rows.ok) {
      form.setError(`medications.${rows.rowIndex}.medicineName`, {
        message: "doctor.visits.errors.incompleteRow",
      });
      return;
    }
    mutation.mutate(
      {
        patientId,
        doctorId,
        visitDate: values.visitDate,
        visitType: values.visitType,
        ...(values.diagnosis.trim() ? { diagnosis: values.diagnosis } : {}),
        ...(values.notes.trim() ? { notes: values.notes } : {}),
        ...(values.requiredTests.trim()
          ? { requiredTests: values.requiredTests }
          : {}),
        medications: rows.rows,
      },
      {
        onSuccess: () => {
          router.push(`/dashboard/doctor/patients/${patientId}`);
        },
      },
    );
  });

  return (
    <form className="flex flex-1 flex-col gap-4" onSubmit={onSubmit}>
      <PendingBackendNotice />

      <Card className="py-0">
        <CardHeader className="border-b border-border px-4 py-3">
          <CardTitle className="text-sm font-medium">
            {t("visits.new.title")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("visits.new.hint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="visit-date">{t("visits.fields.visitDate")}</Label>
              <Input
                id="visit-date"
                type="date"
                {...form.register("visitDate")}
              />
              {form.formState.errors.visitDate ? (
                <p className="text-xs text-destructive">
                  {t(form.formState.errors.visitDate.message ?? "")}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("visits.fields.visitType")}</Label>
              <Select
                defaultValue={form.getValues("visitType")}
                onValueChange={(value) =>
                  form.setValue(
                    "visitType",
                    value as VisitFormData["visitType"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`visits.types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="visit-doctor">
                {t("visits.fields.doctorId")}
              </Label>
              <Input
                disabled
                id="visit-doctor"
                value={doctorId > 0 ? String(doctorId) : ""}
              />
              <p className="text-xs text-muted-foreground">
                {t("visits.fields.doctorIdHint")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="visit-diagnosis">
              {t("visits.fields.diagnosis")}
            </Label>
            <Textarea
              id="visit-diagnosis"
              rows={2}
              {...form.register("diagnosis")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="visit-notes">{t("visits.fields.notes")}</Label>
            <Textarea id="visit-notes" rows={3} {...form.register("notes")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="visit-tests">
              {t("visits.fields.requiredTests")}
            </Label>
            <Textarea
              id="visit-tests"
              rows={2}
              {...form.register("requiredTests")}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
          <div>
            <CardTitle className="text-sm font-medium">
              {t("medications.title")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("medications.allOrNothing")}
            </CardDescription>
          </div>
          <Button
            onClick={() => medicationArray.append({ ...EMPTY_ROW })}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus aria-hidden className="size-4" />
            {t("medications.addRow")}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-4">
          {medicationArray.fields.map((field, index) => (
            <div
              className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
              key={field.id}
            >
              <div className="flex flex-col gap-1">
                <Input
                  aria-label={t("medications.fields.medicineName")}
                  placeholder={t("medications.fields.medicineName")}
                  {...form.register(`medications.${index}.medicineName`)}
                />
                {form.formState.errors.medications?.[index]?.medicineName ? (
                  <p className="text-xs text-destructive">
                    {t("visits.errors.incompleteRow")}
                  </p>
                ) : null}
              </div>
              <Input
                aria-label={t("medications.fields.dosage")}
                placeholder={t("medications.fields.dosage")}
                {...form.register(`medications.${index}.dosage`)}
              />
              <Input
                aria-label={t("medications.fields.frequency")}
                placeholder={t("medications.fields.frequency")}
                {...form.register(`medications.${index}.frequency`)}
              />
              <Input
                aria-label={t("medications.fields.duration")}
                placeholder={t("medications.fields.duration")}
                {...form.register(`medications.${index}.duration`)}
              />
              <Button
                aria-label={t("medications.removeRow")}
                disabled={medicationArray.fields.length === 1}
                onClick={() => medicationArray.remove(index)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 aria-hidden className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? (
            <>
              <Spinner className="size-4" />
              {t("visits.new.saving")}
            </>
          ) : (
            t("visits.new.create")
          )}
        </Button>
        <Button onClick={() => router.back()} type="button" variant="ghost">
          {t("visits.new.cancel")}
        </Button>
      </div>
    </form>
  );
}
