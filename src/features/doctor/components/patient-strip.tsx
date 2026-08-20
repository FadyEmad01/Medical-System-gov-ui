"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type {
  InsuranceEligibilityResponseDto,
  InsuranceVerificationResponseDto,
} from "@/features/insurance/admin/review/types";
import {
  coverageValidTone,
  eligibilityTone,
} from "@/features/insurance/verification/lib/status-tones";

function maskNationalId(nationalId: string | null | undefined): string | null {
  if (!nationalId || nationalId.length < 4) return null;
  return `••••${nationalId.slice(-5)}`;
}

type PatientStripProps = {
  draftId: string;
  onDraftChange: (value: string) => void;
  onLoad: () => void;
  loadedPatientId: number | null;
  eligibility: InsuranceEligibilityResponseDto | null | undefined;
  current: InsuranceVerificationResponseDto | null | undefined;
  isLoading: boolean;
};

export function PatientStrip({
  draftId,
  onDraftChange,
  onLoad,
  loadedPatientId,
  eligibility,
  current,
  isLoading,
}: PatientStripProps) {
  const t = useTranslations("doctor");

  const displayName =
    eligibility?.patientFullName ??
    current?.patientFullName ??
    (loadedPatientId !== null
      ? t("strip.noName", { id: loadedPatientId })
      : null);
  const nationalId =
    eligibility?.patientNationalId ?? current?.patientNationalId ?? null;
  const masked = maskNationalId(nationalId);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onLoad();
            }}
          >
            <div className="min-w-[10rem] flex-1">
              <label
                className="text-xs font-medium"
                htmlFor="doctor-patient-id"
              >
                {t("strip.patientId")}
              </label>
              <Input
                className="mt-1.5 font-mono"
                id="doctor-patient-id"
                inputMode="numeric"
                min={1}
                onChange={(event) => onDraftChange(event.target.value)}
                type="number"
                value={draftId}
              />
            </div>
            <Button disabled={draftId.trim() === "" || isLoading} type="submit">
              {isLoading ? <Spinner className="size-4" /> : null}
              {t("strip.load")}
            </Button>
          </form>

          {loadedPatientId !== null ? (
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-muted px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("strip.loaded")}
                </p>
                <p className="text-sm font-medium">{displayName}</p>
                {masked ? (
                  <p className="font-mono text-xs text-muted-foreground">
                    {t("strip.nidMasked", { masked })}
                  </p>
                ) : null}
              </div>
              <div className="hidden h-8 w-px bg-border sm:block" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("strip.eligibility")}
                </p>
                {eligibility ? (
                  <Badge className={eligibilityTone(eligibility.status)}>
                    {t(`eligibilityStatuses.${eligibility.status}`)}
                  </Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground">
                    {t("strip.none")}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("strip.coverageNow")}
                </p>
                {current?.isCurrentlyValid ? (
                  <Badge className={coverageValidTone(true)}>
                    {current.status}
                    {current.context ? ` · ${current.context}` : ""}
                  </Badge>
                ) : (
                  <Badge className={coverageValidTone(false)}>
                    {t("strip.none")}
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("strip.notLoaded")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
