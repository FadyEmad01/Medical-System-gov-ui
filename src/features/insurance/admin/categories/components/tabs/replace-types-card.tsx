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
import {
  useCategory,
  useReplaceRequirements,
} from "../../hooks/use-categories-admin";
import { KNOWN_DOCUMENT_TYPES } from "../../lib/category-validation";

/** Bulk-replace required document types for a category. */
export function ReplaceTypesCard({ categoryId }: { categoryId: string }) {
  const t = useTranslations("admin");
  const category = useCategory(categoryId);
  const replace = useReplaceRequirements(categoryId);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (category.data) {
      setSelected(category.data.requiredDocumentTypes);
    }
  }, [category.data]);

  const toggle = (value: string) => {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("categories.replace.title")}</CardTitle>
        <CardDescription>{t("categories.replace.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {KNOWN_DOCUMENT_TYPES.map((value) => (
            <Button
              aria-pressed={selected.includes(value)}
              key={value}
              onClick={() => toggle(value)}
              size="sm"
              type="button"
              variant={selected.includes(value) ? "default" : "outline"}
            >
              {value}
            </Button>
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            disabled={replace.isPending}
            onClick={() => replace.mutate(selected)}
          >
            {t("categories.replace.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
