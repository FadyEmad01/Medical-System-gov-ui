"use client";

import { FileSearch, FolderCog, IdCard, ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminGuard } from "@/components/role-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

const LINKS = [
  {
    href: "/dashboard/admin/applications",
    icon: FileSearch,
    titleKey: "home.applications.title",
    descriptionKey: "home.applications.description",
  },
  {
    href: "/dashboard/admin/categories",
    icon: FolderCog,
    titleKey: "home.categories.title",
    descriptionKey: "home.categories.description",
  },
  {
    href: "/dashboard/admin/verification",
    icon: ScanLine,
    titleKey: "home.verification.title",
    descriptionKey: "home.verification.description",
  },
] as const;

export default function AdminHomePage() {
  return (
    <AdminGuard>
      <AdminHomeContent />
    </AdminGuard>
  );
}

function AdminHomeContent() {
  const t = useTranslations("admin");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-medium">{t("home.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("home.description")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((item) => (
          <Link href={item.href} key={item.href}>
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <item.icon className="size-4" />
                  {t(item.titleKey)}
                </CardTitle>
                <CardDescription>{t(item.descriptionKey)}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IdCard className="size-4" />
              {t("home.cards.title")}
            </CardTitle>
            <CardDescription>{t("home.cards.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {t("home.cards.hint")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
