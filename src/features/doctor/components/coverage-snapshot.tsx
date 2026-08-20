"use client";

import { formatDistanceToNow } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type {
  InsuranceEligibilityResponseDto,
  InsuranceVerificationResponseDto,
} from "@/features/insurance/verification/types";
import { eligibilityTone } from "@/features/insurance/verification/lib/status-tones";

type CoverageSnapshotProps = {
  patientId: number | null;
  eligibility: InsuranceEligibilityResponseDto | null | undefined;
  current: InsuranceVerificationResponseDto | null | undefined;
  latest: InsuranceVerificationResponseDto | null | undefined;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

export function CoverageSnapshot({
  patientId,
  eligibility,
  current,
  latest,
  isLoading,
  isError = false,
  onRetry,
}: CoverageSnapshotProps) {
  const t = useTranslations("doctor");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? arSA : enUS;

  return (
    <Card className="flex flex-col py-0">
      <CardHeader className="border-b border-border px-4 py-3">
        <CardTitle className="text-sm font-medium">
          {t("snapshot.title")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("snapshot.hint")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {patientId === null ? (
          <p className="text-sm text-muted-foreground">
            {t("snapshot.needPatient")}
          </p>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-3 py-6">
            <p className="text-sm text-destructive">{t("errors.generic")}</p>
            {onRetry ? (
              <Button onClick={onRetry} size="sm" type="button" variant="outline">
                {t("errors.retry")}
              </Button>
            ) : null}
          </div>
        ) : isLoading && !eligibility && !current && !latest ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <Spinner className="text-primary" />
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-muted p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {t("snapshot.eligibility")}
                </p>
                {eligibility ? (
                  <Badge className={eligibilityTone(eligibility.status)}>
                    {t(`eligibilityStatuses.${eligibility.status}`)}
                  </Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground">—</Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {eligibility?.reason ?? t("snapshot.noEligibility")}
              </p>
            </div>

            <div
              className={
                current?.isCurrentlyValid
                  ? "rounded-xl bg-success/10 p-3"
                  : "rounded-xl bg-muted p-3"
              }
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {t("snapshot.current")}
                </p>
                {current?.isCurrentlyValid ? (
                  <Badge className="bg-success/10 text-success">
                    {t("snapshot.validNow")}
                  </Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground">—</Badge>
                )}
              </div>
              {current ? (
                <>
                  <p className="mt-2 text-sm font-medium">
                    {current.status}
                    {current.context ? ` · ${current.context}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("snapshot.expiresIn", {
                      relative: current.expiresAt
                        ? formatDistanceToNow(new Date(current.expiresAt), {
                            addSuffix: true,
                            locale: dateLocale,
                          })
                        : "—",
                      source: current.source ?? "—",
                    })}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("snapshot.noCurrent")}
                </p>
              )}
            </div>

            <div className="rounded-xl p-3 ring-1 ring-foreground/10">
              <p className="text-xs text-muted-foreground">
                {t("snapshot.latest")}
              </p>
              {latest ? (
                <>
                  <p className="mt-1 text-sm">
                    {latest.status}
                    {latest.context ? ` · ${latest.context}` : ""}
                  </p>
                  {current &&
                  latest.id === current.id &&
                  current.isCurrentlyValid ? (
                    <p className="text-xs text-muted-foreground">
                      {t("snapshot.sameEvent")}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("snapshot.noLatest")}
                </p>
              )}
            </div>

            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              {t("snapshot.accessNote")}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
