"use client";

import { RefreshCwIcon, Trash2Icon, UploadCloudIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useRef } from "react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { formatDocumentFileSize } from "../../lib/document-current";
import {
  DOCUMENT_TYPE_ICON,
  DOCUMENT_TYPE_LABEL_KEY,
} from "../../lib/document-type";
import type {
  CategoryDocumentRequirementDto,
  CitizenDocumentResponseDto,
} from "../../types";

export type UploadSlotState = {
  kind: "idle" | "uploading" | "processing" | "error";
};

/**
 * One required-document slot of the enrollment wizard.
 *
 * Presentational: the parent owns the slot state (uploading/processing/error
 * + inline error text + removed overrides) and receives the selected file
 * through `onUpload`. In the idle state the whole card is the file-picker
 * trigger; once a document exists the patient can replace or remove it, and
 * an error slot can retry the same file or pick another one.
 */
export function UploadSlot({
  requirement,
  current,
  onUpload,
  state,
  errorText,
  onRemove,
}: {
  requirement: CategoryDocumentRequirementDto;
  current: CitizenDocumentResponseDto | null;
  onUpload: (file: File) => void;
  state: UploadSlotState;
  errorText: string | null;
  onRemove: () => void;
}) {
  const t = useTranslations("insurance");
  // The upload action can surface auth-namespace keys (errors.serverUnreachable,
  // errors.requestFailed) for network/timeout failures — never render a raw key.
  const ta = useTranslations("auth");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastFileRef = useRef<File | null>(null);

  const busy = state.kind === "uploading" || state.kind === "processing";
  const labelKey = DOCUMENT_TYPE_LABEL_KEY[requirement.documentType];
  const title = t.has(labelKey) ? t(labelKey) : requirement.displayName;
  const Icon = DOCUMENT_TYPE_ICON[requirement.documentType];

  // errorText is either an i18n key (client validation or the upload action)
  // or a raw server message; translate the key, pass server prose through.
  const translateErrorText = (msg: string): string => {
    if (t.has(msg)) return t(msg);
    if (ta.has(msg)) return ta(msg);
    return msg;
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    lastFileRef.current = file;
    onUpload(file);
    // Reset so the same file can be picked again (a retry after a failure).
    event.target.value = "";
  };

  const retry = () => {
    if (!lastFileRef.current) return;
    onUpload(lastFileRef.current);
  };

  return (
    <Attachment
      className={cn(state.kind === "idle" && !current && "bg-muted/30")}
      state={state.kind === "idle" ? (current ? "done" : "idle") : state.kind}
    >
      {!current && !busy ? (
        <AttachmentTrigger
          onClick={() => inputRef.current?.click()}
          aria-label={title}
        />
      ) : null}

      <AttachmentMedia variant="icon">
        {busy ? <Spinner /> : <Icon />}
      </AttachmentMedia>

      <AttachmentContent>
        <span className="flex min-w-0 items-center gap-1.5">
          <AttachmentTitle className="flex-1">{title}</AttachmentTitle>
          {requirement.isMandatory ? (
            <Badge variant="secondary">{t("documents.mandatory")}</Badge>
          ) : null}
        </span>
        {errorText ? (
          <AttachmentDescription>
            {translateErrorText(errorText)}
          </AttachmentDescription>
        ) : current ? (
          <AttachmentDescription>
            {current.fileName ?? t("documents.uploaded")} ·{" "}
            {formatDocumentFileSize(current.fileSize)}
          </AttachmentDescription>
        ) : requirement.helpText ? (
          <AttachmentDescription>{requirement.helpText}</AttachmentDescription>
        ) : !requirement.isMandatory ? (
          <AttachmentDescription>
            {t("documents.optional")}
          </AttachmentDescription>
        ) : null}
      </AttachmentContent>

      <AttachmentActions>
        {state.kind === "error" ? (
          <AttachmentAction
            variant="destructive"
            size="icon-xs"
            onClick={retry}
            aria-label={t("documents.retry")}
          >
            <RefreshCwIcon />
          </AttachmentAction>
        ) : current ? (
          <>
            <AttachmentAction
              variant="ghost"
              size="icon-xs"
              onClick={() => inputRef.current?.click()}
              aria-label={t("documents.replace")}
            >
              <UploadCloudIcon />
            </AttachmentAction>
            <AttachmentAction
              variant="ghost"
              size="icon-xs"
              onClick={onRemove}
              aria-label={t("documents.remove")}
            >
              <Trash2Icon />
            </AttachmentAction>
          </>
        ) : null}
      </AttachmentActions>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleInputChange}
      />
    </Attachment>
  );
}
