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
import { RequirementDialogFields } from "./requirement-dialog-fields";

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
        <RequirementDialogFields
          editing={Boolean(editing)}
          documentType={documentType}
          onDocumentTypeChange={setDocumentType}
          displayName={displayName}
          onDisplayNameChange={setDisplayName}
          helpText={helpText}
          onHelpTextChange={setHelpText}
          sampleUrl={sampleUrl}
          onSampleUrlChange={setSampleUrl}
          displayOrder={displayOrder}
          onDisplayOrderChange={setDisplayOrder}
          isMandatory={isMandatory}
          onIsMandatoryChange={setIsMandatory}
          isActive={isActive}
          onIsActiveChange={setIsActive}
        />
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
