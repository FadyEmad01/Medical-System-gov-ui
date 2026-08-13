"use client";

import { CircleX } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useCardState } from "../../hooks/use-card";
import { deriveCardState } from "../../lib/card-status";
import { CardStateContent, errorMessageKey } from "./card-state-content";
import InsuranceCardStepper from "./insurance-stepper";

export default function InsuranceCardPage() {
  const t = useTranslations("insurance");
  const { data, isPending, isError, error, refetch, isRefetching } =
    useCardState();

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

  const state = deriveCardState(data.status, data.cards);

  return (
    <div className="flex flex-col gap-4">
      <CardTitle>{t("card.title")}</CardTitle>

      <Card>
        <CardContent>
          <InsuranceCardStepper state={state} />
        </CardContent>
      </Card>

      <CardStateContent state={state} />
    </div>
  );
}
