"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import type { CitizenDocumentResponseDto } from "../../../../enrollment/types";

export function useFormatDate() {
  const locale = useLocale();
  return (iso: string | null) => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
  };
}

export function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value?.trim() || "—"}</dd>
    </div>
  );
}

export const DOC_REVIEW_TONE: Record<
  CitizenDocumentResponseDto["reviewStatus"],
  string
> = {
  Pending: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-revoked/10 text-revoked",
};
