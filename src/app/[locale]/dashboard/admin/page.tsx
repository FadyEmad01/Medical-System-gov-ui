"use client";

import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function AdminPage() {
  const t = useTranslations("common");

  return (
    <AdminGuard>
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyMedia variant="icon">
              <Shield />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{t("comingSoon.title")}</EmptyTitle>
              <EmptyDescription>{t("comingSoon.description")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </AdminGuard>
  );
}
