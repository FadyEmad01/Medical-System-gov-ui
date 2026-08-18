"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { InsuranceCategoryResponseDto } from "@/features/insurance/enrollment/types";
import { useSetEligibilityRule } from "../../hooks/use-categories-admin";
import { KNOWN_MARITAL_STATUSES } from "../../lib/category-validation";

/** Tab 2 — the eligibility rule: ages, marital restriction, guardian/dependents. */
export function RuleTab({
  category,
}: {
  category: InsuranceCategoryResponseDto;
}) {
  const t = useTranslations("admin");
  const rule = useSetEligibilityRule(category.id);
  const [minimumAge, setMinimumAge] = useState("");
  const [maximumAge, setMaximumAge] = useState("");
  const [allowed, setAllowed] = useState<string[]>([]);
  const [guardianRequired, setGuardianRequired] = useState(false);
  const [dependentsAllowed, setDependentsAllowed] = useState(false);

  useEffect(() => {
    setMinimumAge(
      category.minimumAge != null ? String(category.minimumAge) : "",
    );
    setMaximumAge(
      category.maximumAge != null ? String(category.maximumAge) : "",
    );
    setAllowed(category.allowedMaritalStatuses);
    setGuardianRequired(category.guardianRequired);
    setDependentsAllowed(category.dependentsAllowed);
  }, [category]);

  const toggle = (status: string) => {
    setAllowed((current) =>
      current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status],
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("categories.tabs.rule")}</CardTitle>
        <CardDescription>{t("categories.rule.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="rule-min">
              {t("categories.rule.minimumAge")}
            </label>
            <Input
              id="rule-min"
              min={0}
              onChange={(event) => setMinimumAge(event.target.value)}
              type="number"
              value={minimumAge}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="rule-max">
              {t("categories.rule.maximumAge")}
            </label>
            <Input
              id="rule-max"
              min={0}
              onChange={(event) => setMaximumAge(event.target.value)}
              type="number"
              value={maximumAge}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">
            {t("categories.rule.maritalStatuses")}
          </span>
          <div className="flex flex-wrap gap-2">
            {KNOWN_MARITAL_STATUSES.map((status) => (
              <Button
                aria-pressed={allowed.includes(status)}
                key={status}
                onClick={() => toggle(status)}
                size="sm"
                variant={allowed.includes(status) ? "default" : "outline"}
              >
                {t(`categories.marital.${status}`)}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("categories.rule.maritalHint")}
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={guardianRequired}
              onChange={(event) => setGuardianRequired(event.target.checked)}
              type="checkbox"
            />
            {t("categories.rule.guardianRequired")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={dependentsAllowed}
              onChange={(event) => setDependentsAllowed(event.target.checked)}
              type="checkbox"
            />
            {t("categories.rule.dependentsAllowed")}
          </label>
        </div>

        <div className="flex justify-end">
          <Button
            disabled={rule.isPending}
            onClick={() =>
              rule.mutate({
                minimumAge:
                  minimumAge === "" ? null : Number.parseInt(minimumAge, 10),
                maximumAge:
                  maximumAge === "" ? null : Number.parseInt(maximumAge, 10),
                allowedMaritalStatuses: allowed,
                guardianRequired,
                dependentsAllowed,
              })
            }
          >
            {t("categories.rule.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
