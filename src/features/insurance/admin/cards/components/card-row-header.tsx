"use client";

import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { CARD_STATUS_TONE } from "../../../lib/card-status-tone";
import type { CardResponseDto } from "../../../types";
import { formatDate } from "./card-page-shared";

type CardRowHeaderProps = {
  card: CardResponseDto;
  locale: string;
};

/** Card number, holder, dates, and status badge for one history row. */
export function CardRowHeader({ card, locale }: CardRowHeaderProps) {
  const t = useTranslations("admin");

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="flex items-center gap-2 font-medium tabular-nums">
          {card.cardNumber ?? "—"}
          {card.isLatestCard ? (
            <Badge variant="outline">
              <BadgeCheck className="size-3" />
              {t("cards.latest")}
            </Badge>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {card.holderFullName ?? "—"}
          {card.dependentPersonId ? ` · ${t("cards.dependentCard")}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("cards.dates", {
            issued: formatDate(card.issuedAt, locale),
            expires: formatDate(card.expiresAt, locale),
          })}
          {card.replacementReason
            ? ` · ${t(`cards.replacementReason.${card.replacementReason}`)}`
            : ""}
        </p>
        {card.reasonNote ? (
          <p className="text-xs text-muted-foreground">{card.reasonNote}</p>
        ) : null}
      </div>
      <Badge className={CARD_STATUS_TONE[card.status]}>
        {t(`cards.status.${card.status}`)}
      </Badge>
    </div>
  );
}
