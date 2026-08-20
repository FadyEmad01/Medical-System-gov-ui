"use client";

import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimelineStageDto } from "../../../types";
import { formatIsoDate } from "../../lib/format-iso-date";

/**
 * Connected vertical timeline. Node state encodes progress: filled success
 * for completed stages, a primary ring for the current (first incomplete)
 * stage, hollow for upcoming.
 */
export function TimelineSection({ stages }: { stages: TimelineStageDto[] }) {
  const t = useTranslations("insurance");
  const locale = useLocale();
  const currentStageIndex = stages.findIndex((stage) => !stage.isComplete);

  if (stages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tracking.timeline")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col">
          {stages.map((stage, index) => {
            const isCurrent = index === currentStageIndex;
            return (
              <li
                key={`${stage.stageName ?? "stage"}-${index}`}
                className="relative flex gap-3 pb-6 last:pb-0"
              >
                {index < stages.length - 1 ? (
                  <span
                    aria-hidden
                    className={`absolute bottom-0 start-[11px] top-7 w-0.5 rounded-full ${
                      stage.isComplete ? "bg-success/40" : "bg-border"
                    }`}
                  />
                ) : null}
                <span
                  aria-hidden
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                    stage.isComplete
                      ? "bg-success text-card"
                      : isCurrent
                        ? "border-2 border-primary bg-primary/10"
                        : "border bg-muted/50"
                  }`}
                >
                  {stage.isComplete ? (
                    <CheckCircle2 className="size-4" />
                  ) : isCurrent ? (
                    <span className="size-2 rounded-full bg-primary" />
                  ) : null}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                  <p
                    className={`text-sm ${
                      isCurrent
                        ? "font-semibold text-foreground"
                        : stage.isComplete
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {stage.stageName ?? "—"}
                  </p>
                  {stage.timestamp ? (
                    <p className="text-xs text-muted-foreground">
                      {formatIsoDate(stage.timestamp, locale)}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
