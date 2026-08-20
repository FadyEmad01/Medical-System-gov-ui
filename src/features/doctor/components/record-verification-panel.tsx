"use client";

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
import { Textarea } from "@/components/ui/textarea";
import {
  VERIFICATION_CONTEXTS,
  VERIFICATION_STATUSES,
} from "@/features/insurance/verification/lib/constants";
import type { VerifyInsuranceInput } from "@/features/insurance/verification/types";
import { cn } from "@/lib/utils";
import { useRecordVerificationMutation } from "../hooks/use-point-of-care";

type RecordVerificationPanelProps = {
  patientId: number | null;
};

export function RecordVerificationPanel({
  patientId,
}: RecordVerificationPanelProps) {
  const t = useTranslations("doctor");
  const [context, setContext] =
    useState<VerifyInsuranceInput["context"]>("ClinicVisit");
  const [status, setStatus] =
    useState<VerifyInsuranceInput["status"]>("Verified");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const mutation = useRecordVerificationMutation(patientId);

  const canSubmit =
    patientId !== null &&
    reason.trim() !== "" &&
    reason.trim().length <= 1000 &&
    remarks.length <= 2000 &&
    !mutation.isPending;

  return (
    <Card className="flex flex-col py-0">
      <CardHeader className="border-b border-border px-4 py-3">
        <CardTitle className="text-sm font-medium">
          {t("record.title")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("record.hint")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {patientId === null ? (
          <p className="text-sm text-muted-foreground">
            {t("record.needPatient")}
          </p>
        ) : null}

        <div>
          <p className="text-xs font-medium">{t("record.context")}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {VERIFICATION_CONTEXTS.map((value) => (
              <Button
                className={cn(
                  "h-8 rounded-full px-3 text-xs",
                  context === value ? undefined : "text-muted-foreground",
                )}
                key={value}
                onClick={() => setContext(value)}
                size="sm"
                type="button"
                variant={context === value ? "default" : "outline"}
              >
                {t(`record.contexts.${value}`)}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium">{t("record.outcome")}</p>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {VERIFICATION_STATUSES.map((value) => (
              <Button
                className="text-xs"
                key={value}
                onClick={() => setStatus(value)}
                size="sm"
                type="button"
                variant={status === value ? "default" : "outline"}
              >
                {t(`record.statuses.${value}`)}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium" htmlFor="doctor-reason">
            {t("record.reason")}
          </label>
          <Textarea
            className="mt-1.5 min-h-[4.5rem] resize-y"
            id="doctor-reason"
            maxLength={1001}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            value={reason}
          />
        </div>

        <div>
          <label className="text-xs font-medium" htmlFor="doctor-remarks">
            {t("record.remarks")}
          </label>
          <Input
            className="mt-1.5"
            id="doctor-remarks"
            maxLength={2001}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder={t("record.remarksPlaceholder")}
            value={remarks}
          />
        </div>

        <Button
          className="mt-auto w-full"
          disabled={!canSubmit}
          onClick={() => {
            mutation.mutate(
              { status, context, reason, remarks },
              {
                onSuccess: () => {
                  setReason("");
                  setRemarks("");
                },
              },
            );
          }}
          type="button"
        >
          {mutation.isPending ? t("record.saving") : t("record.save")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("record.footnote")}</p>
      </CardContent>
    </Card>
  );
}
