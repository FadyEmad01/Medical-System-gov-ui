"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddRequirement,
  useCategory,
  useDeleteRequirement,
  useReplaceRequirements,
  useRequirements,
  useUpdateRequirement,
} from "../../hooks/use-categories-admin";
import { KNOWN_DOCUMENT_TYPES } from "../../lib/category-validation";
import { RequirementDialog } from "./requirement-dialog";

/** Tab 3 — granular requirement-row CRUD: add, edit, remove, one at a time. */
export function RequirementsTab({ categoryId }: { categoryId: string }) {
  const t = useTranslations("admin");
  const query = useRequirements(categoryId);
  const add = useAddRequirement(categoryId);
  const update = useUpdateRequirement(categoryId);
  const remove = useDeleteRequirement(categoryId);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const requirements = query.data ?? [];

  const editing = requirements.find((item) => item.id === editId);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("categories.tabs.requirements")}</CardTitle>
          <CardDescription>
            {t("categories.requirements.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={() => setAddOpen(true)} size="sm">
              <Plus data-icon="inline-start" />
              {t("categories.requirements.add")}
            </Button>
          </div>

          {query.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : (
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
                        <Badge variant="outline">
                          {requirement.documentType}
                        </Badge>
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
                        {t("categories.fields.order")}:{" "}
                        {requirement.displayOrder}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        onClick={() => setEditId(requirement.id)}
                        size="sm"
                        variant="outline"
                      >
                        {t("categories.requirements.edit")}
                      </Button>
                      <Button
                        aria-label={t("categories.requirements.delete")}
                        onClick={() => setDeleteId(requirement.id)}
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
          )}
        </CardContent>

        <RequirementDialog
          onOpenChange={setAddOpen}
          open={addOpen}
          title={t("categories.requirements.add")}
          onSubmit={(input) => {
            add.mutate(input);
            setAddOpen(false);
          }}
          pending={add.isPending}
        />
        <RequirementDialog
          editing={editing ?? undefined}
          onOpenChange={(open) => (open ? undefined : setEditId(null))}
          open={editId !== null}
          title={t("categories.requirements.edit")}
          onSubmit={(input) => {
            if (editId) update.mutate({ requirementId: editId, input });
            setEditId(null);
          }}
          pending={update.isPending}
        />

        <AlertDialog
          open={deleteId !== null}
          onOpenChange={(open) => (open ? undefined : setDeleteId(null))}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("categories.requirements.deleteConfirm")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("categories.requirements.deleteDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  onClick={() => {
                    if (deleteId) remove.mutate(deleteId);
                    setDeleteId(null);
                  }}
                  variant="destructive"
                >
                  {t("categories.requirements.delete")}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
      <ReplaceTypesCard categoryId={categoryId} />
    </div>
  );
}

function ReplaceTypesCard({ categoryId }: { categoryId: string }) {
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
