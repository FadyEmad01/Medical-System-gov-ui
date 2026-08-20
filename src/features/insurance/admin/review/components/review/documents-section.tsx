"use client";

import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationReviewDetailResponseDto } from "../../types";
import { DOC_REVIEW_TONE, useFormatDate } from "./review-shared";

/** Current documents + collapsed superseded history (re-uploads persist). */
export function DocumentsSection({
  detail,
}: {
  detail: ApplicationReviewDetailResponseDto;
}) {
  const t = useTranslations("admin");
  const formatDate = useFormatDate();
  const [showHistory, setShowHistory] = useState(false);

  const current = detail.documents.filter((document) => document.isCurrent);
  const superseded = detail.documents.filter((document) => !document.isCurrent);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("review.documents.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2">
          {current.map((document) => (
            <li
              className="flex items-center justify-between gap-3"
              key={document.id}
            >
              <a
                className="flex min-w-0 items-center gap-2 text-sm underline-offset-4 hover:underline"
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
              <Badge className={DOC_REVIEW_TONE[document.reviewStatus]}>
                {t(`review.documents.reviewStatus.${document.reviewStatus}`)}
              </Badge>
            </li>
          ))}
          {current.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              {t("review.documents.noneCurrent")}
            </li>
          ) : null}
        </ul>

        {superseded.length > 0 ? (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setShowHistory((value) => !value)}
              size="sm"
              variant="ghost"
            >
              {showHistory ? <ChevronUp /> : <ChevronDown />}
              {t("review.documents.superseded", { count: superseded.length })}
            </Button>
            {showHistory ? (
              <ul className="flex flex-col gap-2 border-t border-border pt-2">
                {superseded.map((document) => (
                  <li
                    className="flex items-center justify-between gap-3 opacity-70"
                    key={document.id}
                  >
                    <a
                      className="flex min-w-0 items-center gap-2 text-sm underline-offset-4 hover:underline"
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
                    <Badge variant="outline">
                      {t("review.documents.supersededBadge")}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
