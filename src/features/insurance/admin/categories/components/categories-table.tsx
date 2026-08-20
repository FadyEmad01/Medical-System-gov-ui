"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { useAllCategories } from "../hooks/use-categories-admin";

/** Categories list table with loading and error states. */
export function CategoriesTable() {
  const t = useTranslations("admin");
  const query = useAllCategories();
  const categories = query.data ?? [];

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        {Array.from({ length: 5 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CircleAlert className="size-4" />
        {t("categories.errors.load")}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("categories.columns.code")}</TableHead>
          <TableHead>{t("categories.columns.name")}</TableHead>
          <TableHead className="text-end">
            {t("categories.columns.order")}
          </TableHead>
          <TableHead className="text-end">
            {t("categories.columns.documents")}
          </TableHead>
          <TableHead>{t("categories.columns.status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell>
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline"
                href={`/dashboard/admin/categories/${category.id}`}
              >
                {category.code}
              </Link>
            </TableCell>
            <TableCell>{category.name}</TableCell>
            <TableCell className="text-end tabular-nums">
              {category.displayOrder}
            </TableCell>
            <TableCell className="text-end tabular-nums">
              {category.documentRequirements.length}
            </TableCell>
            <TableCell>
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
            </TableCell>
          </TableRow>
        ))}
        {categories.length === 0 ? (
          <TableRow>
            <TableCell className="text-muted-foreground">
              {t("categories.errors.none")}
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
