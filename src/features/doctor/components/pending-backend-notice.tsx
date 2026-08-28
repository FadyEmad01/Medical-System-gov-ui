"use client";

import { Hourglass } from "lucide-react";
import { useTranslations } from "next-intl";
import { CLINICAL_API_AVAILABLE } from "../lib/clinical-availability";

/**
 * Inline marker for workspace sections whose backend endpoints have not
 * shipped yet (see docs/backend-gaps-doctor-clinical.md). Rendered beside —
 * never instead of — the target UI so the flow stays visible.
 */
export function PendingBackendNotice() {
  const t = useTranslations("doctor");

  if (CLINICAL_API_AVAILABLE) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-info/10 p-3">
      <Hourglass className="mt-0.5 size-4 shrink-0 text-info" />
      <div>
        <p className="text-xs font-medium text-info">{t("pending.title")}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {t("pending.description")}
        </p>
      </div>
    </div>
  );
}

/** True when clinical sections should render their waiting state. */
export function clinicalPending(): boolean {
  return !CLINICAL_API_AVAILABLE;
}
