"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationReviewDetailResponseDto } from "../../types";
import { DOC_REVIEW_TONE, useFormatDate } from "./review-shared";

/**
 * The decision's evidence: every active category requirement crossed with
 * the current upload of that type. Missing types sit visibly empty.
 */
export function CategoryMatrixSection({
  detail,
}: {
  detail: ApplicationReviewDetailResponseDto;
}) {
  const t = useTranslations("admin");
  const formatDate = useFormatDate();
  const requirements = detail.insuranceCategory.documentRequirements
    .filter((requirement) => requirement.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const currentDocs = new Map(
    detail.documents
      .filter((document) => document.isCurrent)
      .map((document) => [document.documentType, document]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("review.category.title", {
            category: detail.insuranceCategory.name,
          })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {requirements.map((requirement) => {
            const document = currentDocs.get(requirement.documentType);
            return (
              <li
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                key={requirement.id}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-sm font-medium">
                    {requirement.displayName}
                    {requirement.isMandatory ? (
                      <span aria-hidden className="text-revoked">
                        {" "}
                        *
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        ({t("review.category.optional")})
                      </span>
                    )}
                  </p>
                  {requirement.helpText ? (
                    <p className="text-xs text-muted-foreground">
                      {requirement.helpText}
                    </p>
                  ) : null}
                  {document ? (
                    <a
                      className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                      href={document.fileUrl ?? undefined}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="size-3" />
                      {document.fileName ?? t("review.category.viewFile")}
                      <span className="text-muted-foreground">
                        · {formatDate(document.uploadedAt)}
                      </span>
                    </a>
                  ) : (
                    <p className="text-xs font-medium text-warning">
                      {t("review.category.notUploaded")}
                    </p>
                  )}
                </div>
                {document ? (
                  <Badge className={DOC_REVIEW_TONE[document.reviewStatus]}>
                    {t(
                      `review.documents.reviewStatus.${document.reviewStatus}`,
                    )}
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    {t("review.category.missing")}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
