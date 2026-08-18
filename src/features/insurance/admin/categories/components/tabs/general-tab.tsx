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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCategory,
  useUpdateCategory,
} from "../../hooks/use-categories-admin";

/** Tab 1 — identity fields. The code is an identity field: read-only on edit. */
export function GeneralTab({ categoryId }: { categoryId: string }) {
  const t = useTranslations("admin");
  const query = useCategory(categoryId);
  const category = query.data;
  const update = useUpdateCategory(categoryId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description ?? "");
      setDisplayOrder(String(category.displayOrder));
      setIsActive(category.isActive);
    }
  }, [category]);

  if (!category) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("categories.tabs.general")}</CardTitle>
        <CardDescription>{t("categories.general.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            {t("categories.fields.code")}
          </span>
          <Input disabled readOnly value={category.code} />
          <p className="text-xs text-muted-foreground">
            {t("categories.general.codeImmutable")}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="cat-name">
            {t("categories.fields.name")} *
          </label>
          <Input
            id="cat-name"
            maxLength={101}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="cat-description">
            {t("categories.fields.description")}
          </label>
          <Textarea
            id="cat-description"
            maxLength={501}
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="cat-order">
              {t("categories.fields.order")}
            </label>
            <Input
              id="cat-order"
              min={0}
              onChange={(event) => setDisplayOrder(event.target.value)}
              type="number"
              value={displayOrder}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {t("categories.fields.status")}
            </span>
            <Select
              onValueChange={(value) => setIsActive(value === "active")}
              value={isActive ? "active" : "inactive"}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  {t("categories.status.active")}
                </SelectItem>
                <SelectItem value="inactive">
                  {t("categories.status.inactive")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            disabled={update.isPending || name.trim() === ""}
            onClick={() =>
              update.mutate({
                code: category.code,
                name,
                description: description === "" ? null : description,
                displayOrder: Number.parseInt(displayOrder, 10) || 0,
                isActive,
              })
            }
          >
            {t("categories.general.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
