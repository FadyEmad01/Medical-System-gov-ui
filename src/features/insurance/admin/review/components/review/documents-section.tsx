"use client";

import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationReviewDetailResponseDto } from "../../types";
import { DOC_REVIEW_TONE, useFormatDate } from "./review-shared";

/** Flat submission-time snapshot of every document on file (re-uploads included). */
export function DocumentsSection({
  detail,
}: {
  detail: ApplicationReviewDetailResponseDto;
}) {
  const t = useTranslations("admin");
  const formatDate = useFormatDate();
  const documents = detail.documents ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("review.documents.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("review.documents.caption")}
        </p>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {documents.map((document) => (
            <li
              className="flex items-center justify-between gap-3"
              key={document.citizenDocumentId}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <a
                  className="flex items-center gap-2 text-sm underline-offset-4 hover:underline"
                  href={document.fileUrl ?? undefined}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {document.fileName ?? document.documentType}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(document.uploadedAt)}
                  </span>
                </a>
                {document.dependentFullName ? (
                  <p className="text-xs text-muted-foreground">
                    {t("review.documents.forDependent", {
                      name: document.dependentFullName,
                    })}
                  </p>
                ) : null}
              </div>
              <Badge className={DOC_REVIEW_TONE[document.reviewStatus]}>
                {t(`review.documents.reviewStatus.${document.reviewStatus}`)}
              </Badge>
            </li>
          ))}
          {documents.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              {t("review.documents.noneCurrent")}
            </li>
          ) : null}
        </ul>
      </CardContent>
    </Card>
  );
}
