"use client";

import type { LucideIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRecordDecision } from "../hooks/use-record-decision";

/**
 * The shared record-decision card: patient id, decision select, optional
 * context select (verification only), reason + remarks. Both workbench tools
 * (record verification, eligibility check) are configurations of this one
 * component — identical field sets and lifecycle apart from the status enum
 * and the extra context field.
 */
export function RecordDecisionCard<TStatus extends string, TResult>({
  icon: Icon,
  titleKey,
  descriptionKey,
  idPrefix,
  statuses,
  statusLabel,
  contexts,
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
  const form = useRecordDecision<TResult, Parameters<typeof submit>[0]>(submit);

  const record = () =>
    form.record({
      status,
      context: contexts ? context : undefined,
      patientId: Number.parseInt(form.patientId, 10),
      reason: form.reason,
      remarks: form.remarks,
    });

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
        <div className="flex flex-col gap-1">
          <label
            className="text-sm font-medium"
            htmlFor={`${idPrefix}-patient`}
          >
            {t("verification.patientId")} *
          </label>
          <Input
            id={`${idPrefix}-patient`}
            min={1}
            onChange={(event) => form.setPatientId(event.target.value)}
            type="number"
            value={form.patientId}
          />
        </div>

        {contexts ? (
          <div className="grid grid-cols-2 gap-3">
            <StatusSelect
              idPrefix={idPrefix}
              onValueChange={(value) => setStatus(value as TStatus)}
              statusLabel={statusLabel}
              statuses={statuses}
              value={status}
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                {t("verification.context")}
              </span>
              <Select onValueChange={setContext} value={context}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contexts.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <StatusSelect
            idPrefix={idPrefix}
            onValueChange={(value) => setStatus(value as TStatus)}
            statusLabel={statusLabel}
            statuses={statuses}
            value={status}
          />
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor={`${idPrefix}-reason`}>
            {t("verification.reason")} *
          </label>
          <Textarea
            id={`${idPrefix}-reason`}
            maxLength={1001}
            onChange={(event) => form.setReason(event.target.value)}
            value={form.reason}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            className="text-sm font-medium"
            htmlFor={`${idPrefix}-remarks`}
          >
            {t("verification.remarks")}
          </label>
          <Textarea
            id={`${idPrefix}-remarks`}
            maxLength={2001}
            onChange={(event) => form.setRemarks(event.target.value)}
            value={form.remarks}
          />
        </div>
        <Button
          className="self-end"
          disabled={!form.canSubmit}
          onClick={record}
        >
          {t("verification.record")}
        </Button>
      </CardContent>
    </Card>
  );
}

function StatusSelect<TStatus extends string>({
  idPrefix,
  onValueChange,
  statusLabel,
  statuses,
  value,
}: {
  idPrefix: string;
  onValueChange: (value: string) => void;
  statusLabel: (status: TStatus) => string;
  statuses: readonly TStatus[];
  value: TStatus;
}) {
  const t = useTranslations("admin");
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">{t("verification.status")}</span>
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger id={`${idPrefix}-status`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((item) => (
            <SelectItem key={item} value={item}>
              {statusLabel(item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
