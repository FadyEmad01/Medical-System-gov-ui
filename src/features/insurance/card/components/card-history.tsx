"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CardResponseDto } from "../../types";
import { CardHistoryItem } from "./card-history-item";

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
          <CardHistoryItem card={card} key={card.id} locale={locale} />
        ))}
      </CardContent>
    </Card>
  );
}
