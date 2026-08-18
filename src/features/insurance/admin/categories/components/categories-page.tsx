"use client";

import { CircleAlert, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import {
  useAllCategories,
  useCreateCategory,
} from "../hooks/use-categories-admin";
import { validateCategoryInput } from "../lib/category-validation";

/** The Admin category reference-data list, incl. inactive, plus create. */
export default function CategoriesPage() {
  const t = useTranslations("admin");
  const query = useAllCategories();
  const [createOpen, setCreateOpen] = useState(false);
  const categories = query.data ?? [];

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

          {query.isPending ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              {Array.from({ length: 5 }).map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : query.isError ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CircleAlert className="size-4" />
              {t("categories.errors.load")}
            </p>
          ) : (
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
          )}
        </CardContent>
      </Card>

      <CreateCategoryDialog onOpenChange={setCreateOpen} open={createOpen} />
    </div>
  );
}

function CreateCategoryDialog({
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
