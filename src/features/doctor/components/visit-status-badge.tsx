"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { visitStatusTone } from "../lib/visit-status-tone";
import type { VisitStatus } from "../types";

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  const t = useTranslations("doctor");
  return (
    <Badge className={visitStatusTone(status)}>
      {t(`visits.statuses.${status}`)}
    </Badge>
  );
}
