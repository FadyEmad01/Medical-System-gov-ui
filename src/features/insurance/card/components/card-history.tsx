"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { BadgeCheck, ChevronDown, CircleAlert, History } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useCardDetail } from "../../hooks/use-card";
import { CARD_STATUS_TONE } from "../../lib/card-status-tone";
import type { CardResponseDto } from "../../types";

const REPLACEMENT_REASONS = ["Lost", "Damaged", "Stolen", "Other"] as const;

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
}

function replacementLabel(
  reason: string | undefined,
  t: ReturnType<typeof useTranslations>,
): string | null {
  if (!reason) return null;
  if (!(REPLACEMENT_REASONS as readonly string[]).includes(reason)) return null;
  return t(`card.history.replacement.${reason}`);
}

/**
 * The citizen's card history — every card they (or their dependents) have
 * ever held, newest first, with an expandable per-card lifecycle trail.
 * Hidden entirely when the patient never held a card. View-only: lifecycle
 * mutations stay Admin-only.
 */
export function CardHistorySection({
  history,
}: {
  history: CardResponseDto[];
}) {
  const t = useTranslations("insurance");
  const locale = useLocale();

  if (history.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("card.history.title")}</CardTitle>
        <CardDescription>{t("card.history.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {history.map((card) => (
          <CardHistoryRow card={card} key={card.id} locale={locale} />
        ))}
      </CardContent>
    </Card>
  );
}

function CardHistoryRow({
  card,
  locale,
}: {
  card: CardResponseDto;
  locale: string;
}) {
  const t = useTranslations("insurance");
  const [open, setOpen] = useState(false);
  const detail = useCardDetail(card.id, open);
  const replacement = replacementLabel(card.replacementReason, t);

  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <div className="rounded-lg border">
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="flex flex-wrap items-center gap-2 font-medium tabular-nums">
              {card.cardNumber ?? "—"}
              {card.isLatestCard ? (
                <Badge variant="outline">
                  <BadgeCheck className="size-3" />
                  {t("card.history.latest")}
                </Badge>
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground">
              {card.holderFullName ?? "—"}
              {card.dependentPersonId
                ? ` · ${t("card.history.dependent")}`
                : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("card.history.dates", {
                issued: formatDate(card.issuedAt, locale),
                expires: formatDate(card.expiresAt, locale),
              })}
              {replacement ? ` · ${replacement}` : ""}
            </p>
            {card.reasonNote ? (
              <p className="text-xs text-muted-foreground">{card.reasonNote}</p>
            ) : null}
          </div>
          <Badge className={CARD_STATUS_TONE[card.status]}>
            {t(`card.status.${card.status}`)}
          </Badge>
        </div>

        <CollapsibleTrigger asChild>
          <Button
            className="w-full rounded-none border-x-0 border-b-0"
            type="button"
            variant="ghost"
          >
            <ChevronDown className={open ? "rotate-180" : undefined} />
            <History />
            {t("card.history.trail")}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t p-4">
            {detail.isPending ? (
              <Skeleton className="h-12 w-full" />
            ) : detail.isError ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleAlert className="size-4" />
                {t("card.history.trailError")}
              </p>
            ) : detail.data && detail.data.statusHistory.length > 0 ? (
              <ol className="flex flex-col">
                {[...detail.data.statusHistory]
                  .reverse()
                  .map((change, index, all) => (
                    <li
                      className="relative flex gap-3 pb-4 last:pb-0"
                      key={change.id}
                    >
                      {index < all.length - 1 ? (
                        <span
                          aria-hidden
                          className="absolute bottom-0 start-[11px] top-6 w-0.5 rounded-full bg-border"
                        />
                      ) : null}
                      <span
                        aria-hidden
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-info/10 text-info"
                      >
                        <History className="size-3.5" />
                      </span>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="text-sm font-medium">
                          {t("card.history.change", {
                            from: t(`card.status.${change.previousStatus}`),
                            to: t(`card.status.${change.newStatus}`),
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(change.changedAt, locale)}
                        </p>
                        {change.reason ? (
                          <p className="text-xs text-muted-foreground">
                            {change.reason}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("card.history.noChanges")}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
