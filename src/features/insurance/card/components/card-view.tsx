"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { Download, QrCode } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CardResponseDto, CardStatus } from "../../types";

/** Status → badge tone classes built from the semantic status tokens. */
export const CARD_STATUS_TONE: Record<CardStatus, string> = {
  Active: "bg-success/10 text-success",
  Suspended: "bg-warning/10 text-warning",
  Revoked: "bg-revoked/10 text-revoked",
  Superseded: "bg-superseded/10 text-superseded",
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

/**
 * The ready-state insurance card.
 *
 * Clean and neutral on purpose — the production card artwork arrives later.
 * The QR area is a placeholder because the backend never serializes the token,
 * only its version. Download is intentionally disabled: there is no PDF
 * endpoint in the API.
 */
export function CardView({ card }: { card: CardResponseDto }) {
  const t = useTranslations("insurance");
  const locale = useLocale();

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{card.cardNumber ?? "—"}</p>
          <Badge className={CARD_STATUS_TONE[card.status]}>
            {t(`card.status.${card.status}`)}
          </Badge>
        </div>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Detail
            label={t("card.view.holderName")}
            value={card.holderFullName ?? "—"}
          />
          <Detail
            label={t("card.view.issued")}
            value={formatDate(card.issuedAt)}
          />
          <Detail
            label={t("card.view.expires")}
            value={formatDate(card.expiresAt)}
          />
          <Detail
            label={t("card.view.insuranceClass")}
            value={card.cardTemplate ?? "—"}
          />
          <Detail label={t("card.view.familyNumber")} value="—" />
          <Detail
            label={t("card.view.version")}
            value={t("card.view.versionPrefix", { version: card.version })}
          />
        </dl>

        <div className="flex items-center gap-4">
          <div className="flex size-36 shrink-0 items-center justify-center rounded-lg border border-dashed border-muted-foreground/40">
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <QrCode className="size-8" />
              <span className="text-xs">{t("card.qrPlaceholder")}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("card.view.tokenVersion")}: {card.tokenVersion}
          </p>
        </div>
      </CardContent>

      <CardFooter className="justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("card.view.readyNote")}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button type="button" variant="outline" disabled>
                <Download data-icon="inline-start" />
                {t("card.download.comingSoon")}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("card.download.tooltip")}</TooltipContent>
        </Tooltip>
      </CardFooter>
    </Card>
  );
}
