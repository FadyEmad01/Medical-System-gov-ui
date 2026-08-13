"use client";

import {
  CircleX,
  FileSearch,
  FileUp,
  IdCard,
  type LucideIcon,
  ShieldAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isAuthActionError } from "../../hooks/session-guard";
import type { CardState, CardStateKind } from "../../lib/card-status";
import type { CardResponseDto, CardStatus } from "../../types";
import { CARD_STATUS_TONE, CardView } from "./card-view";

export type PendingKind = Extract<
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
  // Active is unreachable via deriveCardState; kept for Record exhaustiveness.
  Active: "",
  Suspended: "border-warning/60",
  Revoked: "border-destructive/60",
  Superseded: "border-info/60",
};

/**
 * Maps a card-state error to an insurance translation key. `unauthorized`
 * (401) means the session is dead; `forbidden` (403) means the user is signed
 * in but lacks permission — both are terminal, but they surface differently.
 */
export function errorMessageKey(error: unknown): string {
  if (!isAuthActionError(error)) return "errors.generic";
  if (error.kind === "unauthorized") return "errors.sessionExpired";
  if (error.kind === "forbidden") return "errors.forbidden";
  if (error.kind === "notFound") return "errors.notFound";
  return "errors.generic";
}

/** Disabled CTA with a tooltip — no documents/applications pages exist yet. */
function ComingSoonButton({
  icon: Icon,
  label,
  tooltip,
}: {
  icon: LucideIcon;
  label: string;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button type="button" variant="outline" disabled>
            <Icon data-icon="inline-start" />
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function EmptyState({ kind }: { kind: PendingKind }) {
  const t = useTranslations("insurance");
  const tCommon = useTranslations("common");

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
          <ComingSoonButton
            icon={FileUp}
            label={t("card.cta.upload")}
            tooltip={tCommon("comingSoon.title")}
          />
          <ComingSoonButton
            icon={FileSearch}
            label={t("card.cta.track")}
            tooltip={tCommon("comingSoon.title")}
          />
        </div>
      </EmptyContent>
    </Empty>
  );
}

function AttentionState({ card }: { card: CardResponseDto }) {
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

export function CardStateContent({ state }: { state: CardState }) {
  if (state.kind === "ready") {
    return state.card ? <CardView card={state.card} /> : null;
  }
  if (state.kind === "attention") {
    return state.card ? <AttentionState card={state.card} /> : null;
  }
  return <EmptyState kind={state.kind} />;
}
