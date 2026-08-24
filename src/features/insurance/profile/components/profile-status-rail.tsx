"use client";

import { useLocale, useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import {
  computeProfileCompleteness,
  LEVEL_COLORS,
} from "../../lib/completeness";
import type { ProfileResponseDto } from "../../types";
import { formatIsoDate } from "./profile-details";

/** Overview-tab side rail: status summary + the profile's missing gate fields. */
export function ProfileStatusRail({
  profile,
}: {
  profile: ProfileResponseDto;
}) {
  const ti = useTranslations("insurance");
  const locale = useLocale();
  const completeness = computeProfileCompleteness(profile);
  const levelColor = LEVEL_COLORS[completeness.level];
  const updated = formatIsoDate(profile.updatedAt ?? profile.createdAt, locale);

  return (
    <aside className="flex flex-col gap-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {ti("profile.status.title")}
      </h2>
      <p className="flex items-center gap-2 text-sm">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: levelColor }}
        />
        {ti(`profile.levels.${completeness.level}`)}
      </p>
      <p className="text-xs text-muted-foreground">
        {ti("profile.status.updated", { date: updated ?? "—" })}
      </p>
      <Separator />
      {completeness.missing.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {completeness.missing.map((field) => (
            <li key={field} className="text-sm text-muted-foreground">
              {ti(`profile.completeness.fields.${field}`)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-success">
          {ti("profile.completeness.complete")}
        </p>
      )}
    </aside>
  );
}
