"use client";

import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parsePatientId } from "@/features/insurance/lib/parse-patient-id";
import { useRecordDecision } from "../hooks/use-record-decision";
import { RecordDecisionFields } from "./record-decision-fields";

/**
 * Shared record-decision card: patient id, decision select, optional
 * context select (verification only), reason + remarks. Both workbench tools
 * are configurations of this component.
 */
export function RecordDecisionCard<TStatus extends string, TResult>({
  icon: Icon,
  titleKey,
  descriptionKey,
  idPrefix,
  statuses,
  statusLabel,
  contexts,
  patientId,
  onPatientIdChange,
  onPatientIdBlur,
  submit,
}: {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  /** Unique field-id prefix so the two cards' labels never collide. */
  idPrefix: string;
  statuses: readonly TStatus[];
  /** i18n key resolver for a status value. */
  statusLabel: (status: TStatus) => string;
  /** When set, renders the context select (verification decisions only). */
  contexts?: readonly { value: string; label: string }[];
  /** Shared across verification + eligibility cards (and URL). */
  patientId: string;
  onPatientIdChange: (value: string) => void;
  onPatientIdBlur?: () => void;
  /** Receives the decision values at click time (no stale captures). */
  submit: (variables: {
    status: TStatus;
    context: string | undefined;
    patientId: number;
    reason: string;
    remarks: string;
  }) => Promise<TResult>;
}) {
  const t = useTranslations("admin");
  const [status, setStatus] = useState<TStatus>(statuses[0]);
  const [context, setContext] = useState(contexts?.[0]?.value ?? "");
  const form = useRecordDecision<TResult, Parameters<typeof submit>[0]>(
    submit,
    patientId,
  );

  const record = () => {
    const id = parsePatientId(patientId);
    if (id === null) {
      toast.error(t("verification.errors.invalidInput"));
      return;
    }
    form.record({
      status,
      context: contexts ? context : undefined,
      patientId: id,
      reason: form.reason,
      remarks: form.remarks,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4" />
          {t(titleKey)}
        </CardTitle>
        <CardDescription>{t(descriptionKey)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <RecordDecisionFields
          context={context}
          contexts={contexts}
          idPrefix={idPrefix}
          onContextChange={setContext}
          onPatientIdBlur={onPatientIdBlur}
          onPatientIdChange={onPatientIdChange}
          onReasonChange={form.setReason}
          onRemarksChange={form.setRemarks}
          onStatusChange={setStatus}
          patientId={patientId}
          reason={form.reason}
          remarks={form.remarks}
          status={status}
          statusLabel={statusLabel}
          statuses={statuses}
        />
        <Button
          className="self-end"
          disabled={!form.canSubmit}
          onClick={record}
          type="button"
        >
          {t("verification.record")}
        </Button>
      </CardContent>
    </Card>
  );
}
