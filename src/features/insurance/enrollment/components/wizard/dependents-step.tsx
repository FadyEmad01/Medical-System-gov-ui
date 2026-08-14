"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { Trash2Icon, UserPlusIcon, UsersIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useDependents } from "../../hooks/use-enrollment";
import { maskNationalId } from "../../lib/dependent-display";
import type { DependentResponseDto } from "../../types";
import { DependentForm } from "./dependent-form";
import { EndRelationshipDialog } from "./end-relationship-dialog";

/**
 * Step 4 — dependents. Lists the patient's active dependents with an "add"
 * dialog and a per-row remove confirmation. The add/end mutations invalidate
 * both the dependents list and the readiness gate (dependentsValid).
 */
export function DependentsStep({ patientId }: { patientId: number }) {
  const t = useTranslations("insurance");
  const locale = useLocale();
  const dependentsQuery = useDependents(patientId);

  const [adding, setAdding] = useState(false);
  const [ending, setEnding] = useState<DependentResponseDto | null>(null);

  const dependents = dependentsQuery.data ?? [];
  const active = dependents.filter((dependent) => dependent.isActive);

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("dependents.description")}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setAdding(true)}
          disabled={adding}
        >
          <UserPlusIcon data-icon="inline-start" />
          {t("dependents.add")}
        </Button>
      </div>

      {dependentsQuery.isLoading ? (
        <div className="flex min-h-32 items-center justify-center">
          <Spinner />
        </div>
      ) : active.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyContent>
            <EmptyTitle>{t("dependents.empty")}</EmptyTitle>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map((dependent) => (
            <Card key={dependent.relationshipId}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">
                      {dependent.fullName ?? "—"}
                    </p>
                    <Badge variant="secondary">
                      {t(
                        `dependents.relationship.${dependent.relationshipType}`,
                      )}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(dependent.dateOfBirth)}
                    {dependent.nationalId
                      ? ` · ${maskNationalId(dependent.nationalId)}`
                      : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEnding(dependent)}
                  aria-label={t("dependents.end")}
                >
                  <Trash2Icon />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dependents.add")}</DialogTitle>
            <DialogDescription>{t("dependents.description")}</DialogDescription>
          </DialogHeader>
          <DependentForm
            onSaved={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </DialogContent>
      </Dialog>

      <EndRelationshipDialog
        dependent={ending}
        onOpenChange={(open) => {
          if (!open) setEnding(null);
        }}
      />
    </div>
  );
}
