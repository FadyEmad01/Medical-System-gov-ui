"use client";

import { FileSearch, FolderCog, IdCard, ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { AdminHomeHero } from "./admin-home-hero";

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
  {
    href: "/dashboard/admin/cards",
    icon: IdCard,
    titleKey: "home.cards.title",
    descriptionKey: "home.cards.description",
  },
] as const;

/** Admin hub: hero + tool shortcuts. */
export function AdminHomeContent() {
  const t = useTranslations("admin");

  return (
    <div className="flex flex-col gap-6">
      <AdminHomeHero />

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">{t("home.toolsTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("home.toolsDescription")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {LINKS.map((item) => (
            <Link className="block h-full" href={item.href} key={item.href}>
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <item.icon className="size-4 shrink-0 text-primary" />
                    {t(item.titleKey)}
                  </CardTitle>
                  <CardDescription>{t(item.descriptionKey)}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
