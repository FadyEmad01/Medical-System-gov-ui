"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KNOWN_DOCUMENT_TYPES } from "../../lib/category-validation";

/** The shape an edit dialog pre-fills from an existing requirement row. */
export interface RequirementDraft {
  displayName: string | null;
  helpText: string | null;
  sampleDocumentUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  isMandatory: boolean;
}

export interface RequirementFormInput {
  documentType: string;
  displayName: string | null;
  helpText: string | null;
  sampleDocumentUrl: string | null;
  displayOrder: number;
  isMandatory: boolean;
  isActive: boolean;
}

/**
 * Shared add/edit dialog for one requirement row. Add shows the closed
 * document-type select; edit keeps the type fixed and adds the isActive
 * toggle.
 */
export function RequirementDialog({
  editing,
  onOpenChange,
  onSubmit,
  open,
  pending,
  title,
}: {
  editing?: RequirementDraft;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: RequirementFormInput) => void;
  open: boolean;
  pending: boolean;
  title: string;
}) {
  const t = useTranslations("admin");
  const [documentType, setDocumentType] = useState("NationalId");
  const [displayName, setDisplayName] = useState("");
  const [helpText, setHelpText] = useState("");
  const [sampleUrl, setSampleUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isMandatory, setIsMandatory] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      setDocumentType(editing ? "" : "NationalId");
      setDisplayName(editing?.displayName ?? "");
      setHelpText(editing?.helpText ?? "");
      setSampleUrl(editing?.sampleDocumentUrl ?? "");
      setDisplayOrder(String(editing?.displayOrder ?? 0));
      setIsMandatory(editing?.isMandatory ?? true);
      setIsActive(editing?.isActive ?? true);
    }
  }, [open, editing]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {!editing ? (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                {t("categories.requirements.documentType")} *
              </span>
              <Select onValueChange={setDocumentType} value={documentType}>
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
              onChange={(event) => setDisplayName(event.target.value)}
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
              onChange={(event) => setHelpText(event.target.value)}
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
              onChange={(event) => setSampleUrl(event.target.value)}
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
                onChange={(event) => setDisplayOrder(event.target.value)}
                type="number"
                value={displayOrder}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={isMandatory}
                onChange={(event) => setIsMandatory(event.target.checked)}
                type="checkbox"
              />
              {t("categories.requirements.mandatory")}
            </label>
            {editing ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  type="checkbox"
                />
                {t("categories.status.active")}
              </label>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {t("actions.cancel")}
          </Button>
          <Button
            disabled={pending || (!editing && documentType === "")}
            onClick={() =>
              onSubmit({
                documentType: documentType || "NationalId",
                displayName: displayName === "" ? null : displayName,
                helpText: helpText === "" ? null : helpText,
                sampleDocumentUrl: sampleUrl === "" ? null : sampleUrl,
                displayOrder: Number.parseInt(displayOrder, 10) || 0,
                isMandatory,
                isActive,
              })
            }
          >
            {title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
