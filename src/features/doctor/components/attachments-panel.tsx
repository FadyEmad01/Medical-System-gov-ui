"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { FileUp, Paperclip } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { validateDocumentFile } from "@/features/insurance/enrollment/lib/file-validation";
import { useUploadAttachmentMutation } from "../hooks/use-attachments";
import { canUploadAttachment } from "../lib/visit-status";
import type { VisitDetailDto } from "../types";

/**
 * POST /visits/{visitId}/attachments — append-only (§10): no replace, no
 * delete affordance. Wrong type/size is caught client-side before network.
 */
export function AttachmentsPanel({ visit }: { visit: VisitDetailDto }) {
  const t = useTranslations("doctor");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? arSA : enUS;
  const mutation = useUploadAttachmentMutation(visit.id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const closed = !canUploadAttachment(visit.status);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const validation = validateDocumentFile(file);
    if (!validation.ok) {
      setError(
        validation.errorKey.endsWith("tooLarge")
          ? t("attachments.errors.tooLarge")
          : t("attachments.errors.invalidType"),
      );
      return;
    }
    setError(null);
    mutation.mutate(
      { visitId: visit.id, file },
      { onSuccess: () => setError(null) },
    );
  };

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
        <div>
          <CardTitle className="text-sm font-medium">
            {t("attachments.title")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("attachments.hint")}
          </CardDescription>
        </div>
        {!closed ? (
          <>
            <input
              accept=".pdf,.jpg,.jpeg,.png"
              aria-hidden
              className="hidden"
              onChange={(event) => onFile(event.target.files?.[0])}
              ref={inputRef}
              type="file"
            />
            <Button
              disabled={mutation.isPending}
              onClick={() => inputRef.current?.click()}
              size="sm"
              type="button"
              variant="outline"
            >
              <FileUp aria-hidden className="size-4" />
              {mutation.isPending
                ? t("attachments.uploading")
                : t("attachments.upload")}
            </Button>
          </>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4">
        {closed ? (
          <div className="rounded-xl bg-warning/10 p-3 text-xs font-medium text-warning">
            {t("attachments.closedBanner")}
          </div>
        ) : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        {visit.attachments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Paperclip className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("attachments.empty")}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {visit.attachments.map((attachment) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted p-3"
                key={attachment.id}
              >
                <div className="min-w-0">
                  <a
                    className="block truncate text-sm font-medium text-primary underline-offset-2 hover:underline"
                    dir="auto"
                    href={attachment.fileUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {attachment.fileName}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {t("attachments.meta", {
                      size: Math.max(1, Math.round(attachment.fileSize / 1024)),
                    })}
                  </p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {format(new Date(attachment.uploadedAt), "PPP", {
                    locale: dateLocale,
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
