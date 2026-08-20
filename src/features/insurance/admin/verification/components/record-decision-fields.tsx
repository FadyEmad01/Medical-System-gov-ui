"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type RecordDecisionFieldsProps<TStatus extends string> = {
  idPrefix: string;
  patientId: string;
  onPatientIdChange: (value: string) => void;
  onPatientIdBlur?: () => void;
  statuses: readonly TStatus[];
  status: TStatus;
  onStatusChange: (value: TStatus) => void;
  statusLabel: (status: TStatus) => string;
  contexts?: readonly { value: string; label: string }[];
  context: string;
  onContextChange: (value: string) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  remarks: string;
  onRemarksChange: (value: string) => void;
};

/** Patient id, status/context selects, reason, and remarks for record-decision. */
export function RecordDecisionFields<TStatus extends string>({
  idPrefix,
  patientId,
  onPatientIdChange,
  onPatientIdBlur,
  statuses,
  status,
  onStatusChange,
  statusLabel,
  contexts,
  context,
  onContextChange,
  reason,
  onReasonChange,
  remarks,
  onRemarksChange,
}: RecordDecisionFieldsProps<TStatus>) {
  const t = useTranslations("admin");

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-patient`}>
          {t("verification.patientId")} *
        </label>
        <Input
          id={`${idPrefix}-patient`}
          inputMode="numeric"
          min={1}
          onBlur={onPatientIdBlur}
          onChange={(event) => onPatientIdChange(event.target.value)}
          type="number"
          value={patientId}
        />
      </div>

      {contexts ? (
        <div className="grid grid-cols-2 gap-3">
          <StatusSelect
            idPrefix={idPrefix}
            onValueChange={(value) => onStatusChange(value as TStatus)}
            statusLabel={statusLabel}
            statuses={statuses}
            value={status}
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {t("verification.context")}
            </span>
            <Select onValueChange={onContextChange} value={context}>
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
          onValueChange={(value) => onStatusChange(value as TStatus)}
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
          onChange={(event) => onReasonChange(event.target.value)}
          value={reason}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-remarks`}>
          {t("verification.remarks")}
        </label>
        <Textarea
          id={`${idPrefix}-remarks`}
          maxLength={2001}
          onChange={(event) => onRemarksChange(event.target.value)}
          value={remarks}
        />
      </div>
    </>
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
