"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoriesTable } from "./categories-table";
import { CreateCategoryDialog } from "./create-category-dialog";

/** The Admin category reference-data list, incl. inactive, plus create. */
export default function CategoriesPage() {
  const t = useTranslations("admin");
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("categories.title")}</CardTitle>
          <CardDescription>{t("categories.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus data-icon="inline-start" />
              {t("categories.create")}
            </Button>
          </div>

          <CategoriesTable />
        </CardContent>
      </Card>

      <CreateCategoryDialog onOpenChange={setCreateOpen} open={createOpen} />
    </div>
  );
}
