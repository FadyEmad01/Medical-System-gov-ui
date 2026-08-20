"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useAddRequirement,
  useDeleteRequirement,
  useRequirements,
  useUpdateRequirement,
} from "../../hooks/use-categories-admin";
import { ReplaceTypesCard } from "./replace-types-card";
import { RequirementDialog } from "./requirement-dialog";
import { RequirementsList } from "./requirements-list";

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

          <RequirementsList
            isPending={query.isPending}
            onDelete={setDeleteId}
            onEdit={setEditId}
            requirements={requirements}
          />
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
