"use client";

import { CreditCard, FilePlus, FileSearch, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMe } from "@/features/auth/hooks/use-me";
import { Link } from "@/i18n/navigation";

const actions = [
  { key: "apply", icon: FilePlus, href: "/dashboard/insurance" },
  { key: "track", icon: FileSearch, href: "/dashboard/insurance/track" },
  { key: "card", icon: CreditCard, href: "/dashboard/insurance-card" },
  { key: "profile", icon: User, href: "/dashboard/profile" },
] as const;

export function QuickActions() {
  const t = useTranslations("dashboard");
  const { data: user } = useMe();

  // Patient-only shortcuts; Admin/Doctor use their own desks.
  // While identity is loading, keep the strip mounted to avoid layout jump.
  if (user != null && user.role !== "Patient") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t("quickActions.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {actions.map(({ key, icon: Icon, href }) => (
            <Link
              key={key}
              href={href}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="flex size-12 items-center justify-center rounded-full border border-input bg-background transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {t(`quickActions.${key}`)}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
