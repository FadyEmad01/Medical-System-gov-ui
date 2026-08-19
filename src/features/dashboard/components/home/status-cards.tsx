"use client";

import { CreditCard, FileText, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/hooks/use-me";
import { CARD_STATUS_TONE } from "@/features/insurance/card/components/card-state-content";
import { useStatus } from "@/features/insurance/enrollment/hooks/use-enrollment";
import { useCardState } from "@/features/insurance/hooks/use-card";
import { useProfile } from "@/features/insurance/hooks/use-profile";
import { APPLICATION_STATUS_TONE } from "@/features/insurance/lib/application-status-tone";
import { deriveCardState } from "@/features/insurance/lib/card-status";
import { computeProfileCompleteness } from "@/features/insurance/lib/completeness";

const LEVEL_TONE: Record<string, string> = {
  low: "bg-revoked/10 text-revoked",
  medium: "bg-warning/10 text-warning",
  high: "bg-success/10 text-success",
};

export function StatusCards() {
  const t = useTranslations("dashboard");
  const ti = useTranslations("insurance");
  const { data: profile } = useProfile();
  const { data: cardState } = useCardState();
  const { data: user } = useMe();

  const patientId = profile?.patientId;
  const { data: appStatus } = useStatus(patientId);

  const completeness = computeProfileCompleteness(profile);
  const card = deriveCardState(
    cardState?.status ?? null,
    cardState?.currentCard ?? null,
  );

  if (user === undefined) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {(["card", "profile", "application"] as const).map((key) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-1 h-7 w-20" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cardStatusText =
    card.kind === "ready" || card.kind === "attention"
      ? ti(`card.status.${cardState?.currentCard?.status ?? "Active"}`)
      : t("status.noCard");

  const cardStatusTone =
    card.kind === "ready" || card.kind === "attention"
      ? CARD_STATUS_TONE[cardState?.currentCard?.status ?? "Active"]
      : "bg-muted text-muted-foreground";

  const appStatusKey = appStatus?.currentApplicationStatus;
  const appStatusText = appStatusKey
    ? ti(`enrollment.status.${appStatusKey}`)
    : t("status.noApplication");
  const appStatusTone = appStatusKey
    ? APPLICATION_STATUS_TONE[appStatusKey]
    : "bg-muted text-muted-foreground";

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("status.cardStatus")}
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cardStatusText}</div>
          <Badge variant="outline" className={`mt-1 text-xs ${cardStatusTone}`}>
            {card.step === 3 ? "✓" : `${card.step}/3`}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("status.profileProgress")}
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserCheck className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completeness.percent}%</div>
          <Badge
            variant="outline"
            className={`mt-1 text-xs ${LEVEL_TONE[completeness.level]}`}
          >
            {completeness.level}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("status.applicationStatus")}
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{appStatusText}</div>
          <Badge variant="outline" className={`mt-1 text-xs ${appStatusTone}`}>
            {appStatusKey ?? "—"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
