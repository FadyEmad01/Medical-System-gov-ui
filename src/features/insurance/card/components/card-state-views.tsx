"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { CircleX, FileSearch, FileUp, IdCard, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Link } from "@/i18n/navigation";
import type { CardStateKind } from "../../lib/card-status";
import { CARD_STATUS_TONE } from "../../lib/card-status-tone";
import type { CardResponseDto, CardStatus, ProfileResponseDto } from "../../types";
import { EgyptianInsuranceCard } from "./egyptian-card";

type PendingKind = Extract<
  CardStateKind,
  "not-started" | "in-progress" | "awaiting-issuance"
>;

/** Contextual empty text per kind, reusing the matching stepper description. */
const EMPTY_DESCRIPTION: Record<PendingKind, string> = {
  "not-started": "card.steps.1.description",
  "in-progress": "card.steps.2.description",
  "awaiting-issuance": "card.steps.3.description",
};

/** Status → Alert border tone. Only unhealthy cards reach the attention state. */
const ATTENTION_BORDER_TONE: Record<CardStatus, string> = {
  // An expired-but-Active card lands in attention (Active && !isCurrentlyValid),
  // so it gets the same validity-warning tone as Suspended.
  Active: "border-warning/60",
  Suspended: "border-warning/60",
  Revoked: "border-destructive/60",
  Superseded: "border-info/60",
};

export function EmptyState({ kind }: { kind: PendingKind }) {
  const t = useTranslations("insurance");

  return (
    <Empty>
      <EmptyMedia variant="icon">
        <IdCard />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{t("card.empty.title")}</EmptyTitle>
        <EmptyDescription>{t(EMPTY_DESCRIPTION[kind])}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/insurance">
              <FileUp data-icon="inline-start" />
              {t("card.cta.apply")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/insurance/track">
              <FileSearch data-icon="inline-start" />
              {t("card.cta.track")}
            </Link>
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}

export function AttentionState({ card }: { card: CardResponseDto }) {
  const t = useTranslations("insurance");
  const isRevoked = card.status === "Revoked";
  const Icon = isRevoked ? CircleX : ShieldAlert;

  return (
    <div className="flex flex-col gap-4">
      <Alert
        className={ATTENTION_BORDER_TONE[card.status]}
        variant={isRevoked ? "destructive" : "default"}
      >
        <Icon />
        <AlertTitle>{t("card.attention.title")}</AlertTitle>
        <AlertDescription>
          {t("card.attention.description", {
            status: t(`card.status.${card.status}`),
          })}
        </AlertDescription>
      </Alert>

      {/* Muted card preview so the affected card stays in context. */}
      <Card className="pointer-events-none opacity-70 select-none">
        <CardContent className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">{card.holderFullName ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              {card.cardNumber ?? "—"}
            </p>
          </div>
          <Badge className={CARD_STATUS_TONE[card.status]}>
            {t(`card.status.${card.status}`)}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

export function ReadyState({
  card,
  profile,
  beneficiaryType,
}: {
  card: CardResponseDto;
  profile: ProfileResponseDto | null;
  beneficiaryType?: string | null;
}) {
  const t = useTranslations("insurance");
  const locale = useLocale();

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
  };

  return (
    <div className="flex flex-col gap-4">
      <EgyptianInsuranceCard
        card={card}
        profile={profile}
        beneficiaryType={beneficiaryType}
      />

      {/* Compact localized status/details row under the card. */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-3">
          <Badge className={CARD_STATUS_TONE[card.status]}>
            {t(`card.status.${card.status}`)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {t("card.view.expires")}:{" "}
            <span className="font-medium text-foreground">
              {formatDate(card.expiresAt)}
            </span>
          </span>
          <span className="text-sm text-muted-foreground">
            {t("card.view.version")}:{" "}
            <span className="font-medium text-foreground">
              {t("card.view.versionPrefix", { version: card.version })}
            </span>
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
