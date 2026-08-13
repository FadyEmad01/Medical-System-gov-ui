"use client";

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Link } from "@/i18n/navigation";

export default function AppointmentsPage() {
  const t = useTranslations("common");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("nav.appointments")}</CardTitle>
        <CardDescription>{t("appointments.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Empty>
          <EmptyMedia variant="icon">
            <CalendarDays />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("comingSoon.title")}</EmptyTitle>
            <EmptyDescription>{t("comingSoon.description")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline">
              <Link href="/dashboard">{t("nav.home")}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  );
}
