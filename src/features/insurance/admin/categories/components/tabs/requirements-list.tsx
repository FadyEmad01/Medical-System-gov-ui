"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryDocumentRequirementDto } from "@/features/insurance/enrollment/types";

export type RequirementsListProps = {
  isPending: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  requirements: CategoryDocumentRequirementDto[];
};

/** Sorted requirements list with edit/delete actions. */
export function RequirementsList({
  isPending,
  onDelete,
  onEdit,
  requirements,
}: RequirementsListProps) {
  const t = useTranslations("admin");

  if (isPending) {
    return <Skeleton className="h-24 w-full" />;
  }

  return (
    <ul className="divide-y divide-border">
      {requirements
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((requirement) => (
          <li
            className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            key={requirement.id}
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="flex items-center gap-2 text-sm font-medium">
                {requirement.displayName || requirement.documentType}
                <Badge variant="outline">{requirement.documentType}</Badge>
                {requirement.isMandatory ? (
                  <Badge className="bg-info/10 text-info">
                    {t("categories.requirements.mandatory")}
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    {t("categories.requirements.optional")}
                  </Badge>
                )}
                {!requirement.isActive ? (
                  <Badge variant="outline">
                    {t("categories.status.inactive")}
                  </Badge>
                ) : null}
              </p>
              {requirement.helpText ? (
                <p className="text-xs text-muted-foreground">
                  {requirement.helpText}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground tabular-nums">
                {t("categories.fields.order")}: {requirement.displayOrder}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                onClick={() => onEdit(requirement.id)}
                size="sm"
                variant="outline"
              >
                {t("categories.requirements.edit")}
              </Button>
              <Button
                aria-label={t("categories.requirements.delete")}
                onClick={() => onDelete(requirement.id)}
                size="icon"
                variant="ghost"
              >
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
      {requirements.length === 0 ? (
        <li className="text-sm text-muted-foreground">
          {t("categories.requirements.none")}
        </li>
      ) : null}
    </ul>
  );
}
