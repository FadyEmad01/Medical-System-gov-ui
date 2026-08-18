"use client";

import { CircleAlert } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllCategories } from "../hooks/use-categories-admin";
import { GeneralTab } from "./tabs/general-tab";
import { PreviewTab } from "./tabs/preview-tab";
import { RequirementsTab } from "./tabs/requirements-tab";
import { RuleTab } from "./tabs/rule-tab";

const TABS = ["general", "rule", "requirements", "preview"] as const;
type Tab = (typeof TABS)[number];

/**
 * The 4-tab category editor shell: General identity, Eligibility rule,
 * Required documents (granular CRUD), and a citizen-eye preview. Each tab
 * owns its own form state and mutations in `tabs/`.
 */
export default function CategoryDetailPage() {
  const t = useTranslations("admin");
  const params = useParams<{ categoryId: string }>();
  const query = useAllCategories();
  const category = query.data?.find((item) => item.id === params.categoryId);
  const [tab, setTab] = useState<Tab>("general");

  if (query.isPending) {
    return <Skeleton className="h-96 w-full" aria-busy="true" />;
  }
  if (query.isError || !category) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CircleAlert className="size-4" />
        {t("categories.errors.load")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex items-start justify-between gap-2 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="text-base">{category.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{category.code}</p>
          </div>
          <Badge
            className={
              category.isActive
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            }
          >
            {t(
              `categories.status.${category.isActive ? "active" : "inactive"}`,
            )}
          </Badge>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-1" role="tablist">
        {TABS.map((value) => (
          <Button
            aria-selected={tab === value}
            key={value}
            onClick={() => setTab(value)}
            role="tab"
            size="sm"
            variant={tab === value ? "default" : "outline"}
          >
            {t(`categories.tabs.${value}`)}
          </Button>
        ))}
      </div>

      {tab === "general" ? <GeneralTab categoryId={category.id} /> : null}
      {tab === "rule" ? <RuleTab category={category} /> : null}
      {tab === "requirements" ? (
        <RequirementsTab categoryId={category.id} />
      ) : null}
      {tab === "preview" ? <PreviewTab categoryId={category.id} /> : null}
    </div>
  );
}
