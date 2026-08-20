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
import { KNOWN_DOCUMENT_TYPES } from "../../lib/category-validation";

export type RequirementDialogFieldsProps = {
  editing: boolean;
  documentType: string;
  onDocumentTypeChange: (value: string) => void;
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  helpText: string;
  onHelpTextChange: (value: string) => void;
  sampleUrl: string;
  onSampleUrlChange: (value: string) => void;
  displayOrder: string;
  onDisplayOrderChange: (value: string) => void;
  isMandatory: boolean;
  onIsMandatoryChange: (value: boolean) => void;
  isActive: boolean;
  onIsActiveChange: (value: boolean) => void;
};

/** Presentational form fields for add/edit requirement dialogs. */
export function RequirementDialogFields({
  editing,
  documentType,
  onDocumentTypeChange,
  displayName,
  onDisplayNameChange,
  helpText,
  onHelpTextChange,
  sampleUrl,
  onSampleUrlChange,
  displayOrder,
  onDisplayOrderChange,
  isMandatory,
  onIsMandatoryChange,
  isActive,
  onIsActiveChange,
}: RequirementDialogFieldsProps) {
  const t = useTranslations("admin");

  return (
    <div className="flex flex-col gap-3">
      {!editing ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            {t("categories.requirements.documentType")} *
          </span>
          <Select onValueChange={onDocumentTypeChange} value={documentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KNOWN_DOCUMENT_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="req-name">
          {t("categories.requirements.displayName")}
        </label>
        <Input
          id="req-name"
          maxLength={201}
          onChange={(event) => onDisplayNameChange(event.target.value)}
          value={displayName}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="req-help">
          {t("categories.requirements.helpText")}
        </label>
        <Input
          id="req-help"
          maxLength={501}
          onChange={(event) => onHelpTextChange(event.target.value)}
          value={helpText}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="req-url">
          {t("categories.requirements.sampleUrl")}
        </label>
        <Input
          id="req-url"
          maxLength={501}
          onChange={(event) => onSampleUrlChange(event.target.value)}
          placeholder="https://…"
          value={sampleUrl}
        />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="req-order">
            {t("categories.fields.order")}
          </label>
          <Input
            id="req-order"
            min={0}
            onChange={(event) => onDisplayOrderChange(event.target.value)}
            type="number"
            value={displayOrder}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            checked={isMandatory}
            onChange={(event) => onIsMandatoryChange(event.target.checked)}
            type="checkbox"
          />
          {t("categories.requirements.mandatory")}
        </label>
        {editing ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={isActive}
              onChange={(event) => onIsActiveChange(event.target.checked)}
              type="checkbox"
            />
            {t("categories.status.active")}
          </label>
        ) : null}
      </div>
    </div>
  );
}
