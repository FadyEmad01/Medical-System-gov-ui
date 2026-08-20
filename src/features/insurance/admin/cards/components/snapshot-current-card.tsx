"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CARD_STATUS_TONE } from "../../../lib/card-status-tone";
import type { CardResponseDto } from "../../../types";

type SnapshotCurrentCardProps = {
  isPending: boolean;
  card: CardResponseDto | null | undefined;
};

/** Current card number + status badge for the patient snapshot. */
export function SnapshotCurrentCard({
  isPending,
  card,
}: SnapshotCurrentCardProps) {
  const t = useTranslations("admin");

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-muted-foreground">
        {t("cards.snapshot.current")}
      </p>
      {isPending ? (
        <Skeleton className="h-8 w-full" />
      ) : card ? (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium tabular-nums">
            {card.cardNumber ?? "—"}
          </span>
          <Badge className={CARD_STATUS_TONE[card.status]}>
            {t(`cards.status.${card.status}`)}
          </Badge>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("cards.snapshot.noCurrent")}
        </p>
      )}
    </div>
  );
}
