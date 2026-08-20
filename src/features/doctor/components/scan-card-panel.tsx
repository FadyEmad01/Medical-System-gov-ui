"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { ScanLine } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { CARD_STATUS_TONE } from "@/features/insurance/lib/card-status-tone";
import { useVerifyCardMutation } from "../hooks/use-point-of-care";

export function ScanCardPanel() {
  const t = useTranslations("doctor");
  const locale = useLocale();
  const [token, setToken] = useState("");
  const mutation = useVerifyCardMutation();
  const result = mutation.data ?? null;

  return (
    <Card className="flex flex-col py-0">
      <CardHeader className="border-b border-border px-4 py-3">
        <CardTitle className="text-sm font-medium">{t("scan.title")}</CardTitle>
        <CardDescription className="text-xs">{t("scan.hint")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 px-4 py-10 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-card ring-1 ring-foreground/10">
            <ScanLine className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{t("scan.ready")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("scan.pasteHint")}
          </p>
        </div>

        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const scanned = token.trim();
            if (scanned !== "") mutation.mutate(scanned);
          }}
        >
          <Input
            className="font-mono text-xs"
            onChange={(event) => setToken(event.target.value)}
            placeholder={t("scan.placeholder")}
            value={token}
          />
          <Button
            className="w-full"
            disabled={mutation.isPending || token.trim() === ""}
            type="submit"
          >
            {mutation.isPending ? t("scan.checking") : t("scan.verify")}
          </Button>
        </form>

        {result ? (
          <div
            className={
              result.isCurrentlyValid
                ? "rounded-xl border border-transparent bg-success/10 p-3"
                : "rounded-xl border border-transparent bg-destructive/10 p-3"
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p
                  className={`text-xs font-medium ${
                    result.isCurrentlyValid
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {result.isCurrentlyValid
                    ? t("scan.accept")
                    : t("scan.reject")}
                </p>
                <p className="mt-0.5 font-medium tabular-nums">
                  {result.cardNumber ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {result.holderFullName ?? "—"}
                </p>
              </div>
              <Badge className={CARD_STATUS_TONE[result.status]}>
                {result.status}
              </Badge>
            </div>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {t("scan.expires", {
                valid: String(result.isCurrentlyValid),
                date: result.expiresAt
                  ? format(new Date(result.expiresAt), "PPP", {
                      locale: locale === "ar" ? arSA : enUS,
                    })
                  : "—",
              })}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
