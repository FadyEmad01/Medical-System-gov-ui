"use client";

import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationReviewDetailResponseDto } from "../../types";
import { useFormatDate } from "./review-shared";

/** Dependents + eligibility/verification snapshots. */
export function ContextSection({
  detail,
}: {
  detail: ApplicationReviewDetailResponseDto;
}) {
  const t = useTranslations("admin");
  const formatDate = useFormatDate();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("review.dependents.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.dependents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("review.dependents.none")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {detail.dependents.map((dependent) => (
                <li
                  className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  key={dependent.relationshipId}
                >
                  <div className="flex min-w-0 flex-col">
                    <p className="text-sm font-medium">
                      {dependent.fullName ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        `review.dependents.relationship.${dependent.relationshipType}`,
                      )}
                      {" · "}
                      {formatDate(dependent.dateOfBirth)}
                    </p>
                  </div>
                  {dependent.isActive ? (
                    <Badge variant="outline">
                      <BadgeCheck className="size-3" />
                      {t("review.dependents.active")}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {t("review.dependents.inactive")}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("review.checks.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">
              {t("review.checks.eligibility")}
            </dt>
            <dd className="text-sm">
              {detail.eligibility ? (
                <>
                  <Badge
                    className={
                      detail.eligibility.status === "Eligible"
                        ? "bg-success/10 text-success"
                        : detail.eligibility.status === "NotEligible"
                          ? "bg-revoked/10 text-revoked"
                          : "bg-warning/10 text-warning"
                    }
                  >
                    {detail.eligibility.status}
                  </Badge>
                  <span className="ms-2 text-muted-foreground">
                    {formatDate(detail.eligibility.checkedAt)}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  {t("review.checks.notChecked")}
                </span>
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">
              {t("review.checks.verification")}
            </dt>
            <dd className="text-sm">
              {detail.verification ? (
                <>
                  <Badge
                    className={
                      detail.verification.status === "Verified"
                        ? "bg-success/10 text-success"
                        : detail.verification.status === "NotVerified"
                          ? "bg-revoked/10 text-revoked"
                          : "bg-warning/10 text-warning"
                    }
                  >
                    {detail.verification.status}
                  </Badge>
                  <span className="ms-2 text-muted-foreground">
                    {formatDate(detail.verification.verifiedAt)}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  {t("review.checks.notChecked")}
                </span>
              )}
            </dd>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
