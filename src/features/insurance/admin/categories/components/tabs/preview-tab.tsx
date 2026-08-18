"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAllCategories } from "../../hooks/use-categories-admin";

/** Tab 4 — the citizen-eye read-only view: what the wizard will render. */
export function PreviewTab({ categoryId }: { categoryId: string }) {
  const t = useTranslations("admin");
  const query = useAllCategories();
  const category = query.data?.find((item) => item.id === categoryId);
  if (!category) return null;

  const activeRequirements = category.documentRequirements
    .filter((requirement) => requirement.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("categories.tabs.preview")}</CardTitle>
        <CardDescription>{t("categories.preview.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-base font-medium">{category.name}</p>
          {category.description ? (
            <p className="text-sm text-muted-foreground">
              {category.description}
            </p>
          ) : null}
        </div>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Badge variant="outline">
              {t("categories.rule.minimumAge")}: {category.minimumAge ?? "—"}
            </Badge>
          </li>
          <li>
            <Badge variant="outline">
              {t("categories.rule.maximumAge")}: {category.maximumAge ?? "—"}
            </Badge>
          </li>
          <li>
            <Badge variant="outline">
              {t("categories.rule.guardianRequired")}:{" "}
              {category.guardianRequired
                ? t("categories.preview.yes")
                : t("categories.preview.no")}
            </Badge>
          </li>
          <li>
            <Badge variant="outline">
              {t("categories.rule.dependentsAllowed")}:{" "}
              {category.dependentsAllowed
                ? t("categories.preview.yes")
                : t("categories.preview.no")}
            </Badge>
          </li>
        </ul>
        <ul className="divide-y divide-border">
          {activeRequirements.map((requirement) => (
            <li
              className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
              key={requirement.id}
            >
              <div className="flex min-w-0 flex-col">
                <p className="text-sm font-medium">
                  {requirement.displayName || requirement.documentType}
                </p>
                {requirement.helpText ? (
                  <p className="text-xs text-muted-foreground">
                    {requirement.helpText}
                  </p>
                ) : null}
              </div>
              <Badge
                className={
                  requirement.isMandatory
                    ? "bg-info/10 text-info"
                    : "bg-muted text-muted-foreground"
                }
              >
                {requirement.isMandatory
                  ? t("categories.requirements.mandatory")
                  : t("categories.requirements.optional")}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
