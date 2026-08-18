"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";

/** Entry point when there is no global card list — resolve a patient, then open history. */
export default function CardsLookupPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [patientId, setPatientId] = useState("");

  const openCards = () => {
    const id = Number.parseInt(patientId.trim(), 10);
    if (!Number.isInteger(id) || id < 1) {
      toast.error(t("cards.errors.invalidPatientId"));
      return;
    }
    router.push(`/dashboard/admin/cards/${id}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("home.cards.title")}</CardTitle>
        <CardDescription>{t("home.cards.hint")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            openCards();
          }}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label htmlFor="cards-patient-id">
              {t("home.cards.patientId")}
            </Label>
            <Input
              autoComplete="off"
              id="cards-patient-id"
              inputMode="numeric"
              onChange={(event) => setPatientId(event.target.value)}
              placeholder={t("home.cards.placeholder")}
              value={patientId}
            />
          </div>
          <Button disabled={patientId.trim() === ""} type="submit">
            {t("home.cards.open")}
          </Button>
        </form>
        <Link
          className="text-sm text-primary underline-offset-4 hover:underline"
          href="/dashboard/admin/applications"
        >
          {t("home.cards.fromReview")}
        </Link>
      </CardContent>
    </Card>
  );
}
