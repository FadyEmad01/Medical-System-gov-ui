"use client";

import { CircleX } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useDependents } from "../../enrollment/hooks/use-enrollment";
import { useCardState } from "../../hooks/use-card";
import { useProfile } from "../../hooks/use-profile";
import { deriveCardState } from "../../lib/card-status";
import { resolveBeneficiaryType } from "../lib/beneficiary-type";
import { CardHistorySection } from "./card-history";
import { CardStateContent, errorMessageKey } from "./card-state-content";
import InsuranceCardStepper from "./insurance-stepper";

export default function InsuranceCardPage() {
  const t = useTranslations("insurance");
  const { data, isPending, isError, error, refetch, isRefetching } =
    useCardState();
  const { data: profile } = useProfile();
  const { data: dependents } = useDependents(profile?.patientId ?? null);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-48" />
        <Card>
          <CardContent className="flex flex-col gap-4 py-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4">
        <CardTitle>{t("card.title")}</CardTitle>
        <Alert variant="destructive">
          <CircleX />
          <AlertTitle>{t("card.error.title")}</AlertTitle>
          <AlertDescription>{t(errorMessageKey(error))}</AlertDescription>
        </Alert>
        <div className="flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isRefetching}
          >
            {isRefetching && <Spinner data-icon="inline-start" />}
            {t("card.retry")}
          </Button>
        </div>
      </div>
    );
  }

  const state = deriveCardState(data.status, data.currentCard);

  // Silent "—" fallback is deliberate: getDependentsAction has no 404→[]
  // mapping (api-client maps 404→notFound, useInsuranceActionQuery throws on
  // !res.ok), so on query error `dependents` is undefined and a dependent
  // card's badge degrades to "—" — accepted behavior for a decorative badge
  // (401 is still handled by the session guard effect).
  const beneficiaryType = resolveBeneficiaryType(state.card, dependents);

  return (
    <div className="flex flex-col gap-4">
      <CardTitle>{t("card.title")}</CardTitle>

      <Card>
        <CardContent>
          <InsuranceCardStepper state={state} />
        </CardContent>
      </Card>

      <CardStateContent
        state={state}
        profile={profile ?? null}
        beneficiaryType={beneficiaryType}
      />

      <CardHistorySection history={data.cardHistory} />
    </div>
  );
}
