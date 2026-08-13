"use client";

import { CircleAlert, CircleCheck, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import {
  type CompletenessLevel,
  computeProfileCompleteness,
} from "../../lib/completeness";
import type { ProfileResponseDto } from "../../types";

/** Completeness level → gauge/badge color from the semantic status tokens. */
const LEVEL_COLORS: Record<CompletenessLevel, string> = {
  low: "var(--revoked)",
  medium: "var(--warning)",
  high: "var(--success)",
};

export function CompletenessCard({
  profile,
  onEdit,
}: {
  profile: ProfileResponseDto;
  onEdit: () => void;
}) {
  const t = useTranslations("insurance");
  const completeness = computeProfileCompleteness(profile);
  const levelColor = LEVEL_COLORS[completeness.level];
  const gaugeData = [{ value: completeness.percent, fill: levelColor }];
  const chartConfig = useMemo(
    () =>
      ({
        value: {
          label: t("profile.completeness.title"),
          color: levelColor,
        },
      }) satisfies ChartConfig,
    [t, levelColor],
  );

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>{t("profile.completeness.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div
          role="img"
          aria-label={`${t("profile.completeness.title")}: ${completeness.percent}%`}
          className="relative mx-auto w-full max-w-52"
        >
          <ChartContainer config={chartConfig} className="aspect-square w-full">
            <RadialBarChart
              data={gaugeData}
              // 90 starts at top (12 o'clock); -270 completes a full
              // clockwise circle so the gauge reads from the top.
              startAngle={90}
              endAngle={-270}
              innerRadius="70%"
              outerRadius="95%"
            >
              {/* 100 is the absolute max value on the gauge. */}
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                background={{ fill: "var(--muted)" }} // Full 360 track
                fill={levelColor} // Progress fill
              />
            </RadialBarChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-3xl font-bold tabular-nums">
              {completeness.percent}%
            </span>
            <Badge
              variant="outline"
              style={{ color: levelColor, borderColor: levelColor }}
            >
              {t(`profile.levels.${completeness.level}`)}
            </Badge>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t("profile.completeness.filled", {
            filled: completeness.filled,
            total: completeness.total,
          })}
        </p>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">
            {t("profile.completeness.additionalData")}
          </h3>
          {completeness.missing.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {completeness.missing.map((field) => (
                <li
                  key={field}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CircleAlert className="size-4 shrink-0 text-warning" />
                  <span>{t(`profile.completeness.fields.${field}`)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CircleCheck className="size-4 shrink-0 text-success" />
              <span>{t("profile.completeness.complete")}</span>
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          className="w-full"
        >
          <Pencil data-icon="inline-start" />
          {t("profile.edit")}
        </Button>
      </CardContent>
    </Card>
  );
}
