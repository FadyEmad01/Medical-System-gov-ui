"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateCategory } from "../hooks/use-categories-admin";
import { validateCategoryInput } from "../lib/category-validation";

export function CreateCategoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState("1");

  const create = useCreateCategory();

  useEffect(() => {
    if (open) {
      setCode("");
      setName("");
      setDescription("");
      setDisplayOrder("1");
    }
  }, [open]);

  const draft = {
    code,
    name,
    description: description === "" ? null : description,
    displayOrder: Number.parseInt(displayOrder, 10) || 0,
    isActive: true,
  };
  const valid = validateCategoryInput(draft).ok;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("categories.dialogs.create.title")}</DialogTitle>
          <DialogDescription>
            {t("categories.dialogs.create.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="new-category-code">
              {t("categories.fields.code")} *
            </label>
            <Input
              id="new-category-code"
              maxLength={51}
              onChange={(event) => setCode(event.target.value)}
              value={code}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="new-category-name">
              {t("categories.fields.name")} *
            </label>
            <Input
              id="new-category-name"
              maxLength={101}
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-medium"
              htmlFor="new-category-description"
            >
              {t("categories.fields.description")}
            </label>
            <Input
              id="new-category-description"
              maxLength={501}
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="new-category-order">
              {t("categories.fields.order")}
            </label>
            <Input
              id="new-category-order"
              min={0}
              onChange={(event) => setDisplayOrder(event.target.value)}
              type="number"
              value={displayOrder}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {t("actions.cancel")}
          </Button>
          <Button
            disabled={!valid || create.isPending}
            onClick={() => {
              create.mutate(draft, { onSuccess: () => onOpenChange(false) });
            }}
          >
            {t("categories.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
