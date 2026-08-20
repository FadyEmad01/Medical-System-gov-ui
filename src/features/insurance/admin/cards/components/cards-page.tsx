"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCardHistory } from "../hooks/use-card-lifecycle";
import { CardRow } from "./card-row";
import { PatientSnapshot } from "./patient-snapshot";

/**
 * The Admin card-management screen: one patient's full card history with
 * per-card lifecycle actions and an expandable audit trail per card.
 */
export default function CardsPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const params = useParams<{ patientId: string }>();
  const patientId = Number.parseInt(params.patientId, 10);

  const historyQuery = useCardHistory(
    Number.isFinite(patientId) ? patientId : 0,
  );
  const cards = historyQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PatientSnapshot patientId={Number.isFinite(patientId) ? patientId : 0} />
      <Card>
        <CardHeader>
          <CardTitle>{t("cards.title")}</CardTitle>
          <CardDescription>{t("cards.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {historyQuery.isPending ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              {Array.from({ length: 3 }).map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : historyQuery.isError ? (
            <p className="text-sm text-muted-foreground">
              {t("cards.errors.load")}
            </p>
          ) : cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("cards.errors.none")}
            </p>
          ) : (
            cards.map((card) => (
              <CardRow
                key={card.id}
                card={card}
                locale={locale}
                patientId={patientId}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
