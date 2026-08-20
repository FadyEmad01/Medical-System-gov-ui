"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InsuranceCategoryResponseDto } from "../../types";

export type CategoryCardBodyProps = {
  category: InsuranceCategoryResponseDto;
  pending: boolean;
  selected: string;
  onSelect: (value: string) => void;
};

/**
 * Presentational body for a category card: meta badges, notes, and apply
 * Select. Mutation wiring stays in CategoryCard.
 */
export function CategoryCardBody({
  category,
  pending,
  selected,
  onSelect,
}: CategoryCardBodyProps) {
  const t = useTranslations("insurance");

  const activeDocuments = category.documentRequirements.filter(
    (requirement) => requirement.isActive,
  ).length;

  const ageLabel = (() => {
    const { minimumAge: min, maximumAge: max } = category;
    if (min !== null && max !== null) {
      return t("categories.ageRange", { min, max });
    }
    if (min !== null) return t("categories.ageMinOnly", { min });
    if (max !== null) return t("categories.ageMaxOnly", { max });
    return null;
  })();

  const maritalStatuses =
    category.allowedMaritalStatuses.length > 0
      ? category.allowedMaritalStatuses
          .map((status) => t(`profile.maritalStatus.${status}`))
          .join(", ")
      : null;

  return (
    <>
      <CardHeader>
        <CardTitle>{category.name}</CardTitle>
        {category.description ? (
          <CardDescription>{category.description}</CardDescription>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {ageLabel ? <Badge variant="secondary">{ageLabel}</Badge> : null}
          {maritalStatuses ? (
            <Badge variant="secondary">
              {t("categories.maritalEligible")}: {maritalStatuses}
            </Badge>
          ) : null}
          <Badge variant="outline">
            {t("categories.documentsRequired", { count: activeDocuments })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {category.dependentsAllowed === false ? (
          <p className="text-xs text-muted-foreground">
            {t("categories.dependentsNotAllowed")}
          </p>
        ) : null}
        {category.guardianRequired ? (
          <p className="text-xs text-muted-foreground">
            {t("categories.guardianRequired")}
          </p>
        ) : null}
      </CardContent>

      <CardFooter>
        <Select
          value={selected}
          disabled={pending}
          onValueChange={(value) => {
            if (value) onSelect(value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={category.name} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={category.id}>{category.name}</SelectItem>
          </SelectContent>
        </Select>
      </CardFooter>
    </>
  );
}
