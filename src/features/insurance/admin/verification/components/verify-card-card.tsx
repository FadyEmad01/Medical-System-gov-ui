"use client";

import { useMutation } from "@tanstack/react-query";
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
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { CARD_STATUS_TONE } from "../../../lib/card-status-tone";
import { verifyCardAction } from "../actions";
import { useVerificationMutationError } from "../hooks/use-verification-mutation-error";
import type { CardVerificationResultDto } from "../types";

/** The point-of-care token check: scan a card QR token, get the minimal result. */
export function VerifyCardCard() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [token, setToken] = useState("");
  const [result, setResult] = useState<CardVerificationResultDto | null>(null);
  const onError = useVerificationMutationError();

  const mutation = useMutation<
    CardVerificationResultDto,
    AuthActionError,
    string
  >({
    mutationFn: async (scanned) => {
      const res = await verifyCardAction(scanned);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: setResult,
    onError,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="size-4" />
          {t("verification.card.title")}
        </CardTitle>
        <CardDescription>{t("verification.card.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const scanned = token.trim();
            if (scanned !== "") mutation.mutate(scanned);
          }}
        >
          <Input
            onChange={(event) => setToken(event.target.value)}
            placeholder={t("verification.card.placeholder")}
            value={token}
          />
          <Button
            disabled={mutation.isPending || token.trim() === ""}
            type="submit"
          >
            {t("verification.card.verify")}
          </Button>
        </form>

        {mutation.isPending ? (
          <p className="text-sm text-muted-foreground">
            {t("verification.card.checking")}
          </p>
        ) : null}

        {result ? (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium tabular-nums">
                {result.cardNumber ?? "—"}
              </p>
              <Badge className={CARD_STATUS_TONE[result.status]}>
                {result.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm">{result.holderFullName ?? "—"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("verification.card.expires", {
                date: result.expiresAt
                  ? format(new Date(result.expiresAt), "PPP", {
                      locale: locale === "ar" ? arSA : enUS,
                    })
                  : "—",
              })}
            </p>
            <p
              className={`mt-2 text-sm font-medium ${
                result.isCurrentlyValid ? "text-success" : "text-revoked"
              }`}
            >
              {result.isCurrentlyValid
                ? t("verification.card.valid")
                : t("verification.card.notValid")}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
