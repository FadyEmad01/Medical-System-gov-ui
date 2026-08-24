"use client";

import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { type CompletenessLevel, LEVEL_COLORS } from "../../lib/completeness";
import type { ProfileResponseDto } from "../../types";
import { governorateLabel } from "./profile-details";

/** Soft level tint for the completeness badge — mirrors ring/rail semantics. */
const LEVEL_TONE: Record<CompletenessLevel, string> = {
  high: "bg-success/10 border-success text-success dark:bg-success/15",
  medium: "bg-warning/10 border-warning text-warning dark:bg-warning/15",
  low: "bg-revoked/10 border-revoked text-revoked dark:bg-revoked/15",
};

interface ProfileHeaderProps {
  profile: ProfileResponseDto;
  /** Completeness percentage (0–100) rendered as the avatar ring. */
  percent: number;
  level: CompletenessLevel;
  editing: boolean;
  onToggleEditing: () => void;
}

export function ProfileHeader({
  profile,
  percent,
  level,
  editing,
  onToggleEditing,
}: ProfileHeaderProps) {
  const ta = useTranslations("auth");
  const ti = useTranslations("insurance");
  const levelColor = LEVEL_COLORS[level];

  const subtitleSegments = [profile.nationalId, profile.occupation].flatMap(
    (segment) => (segment && segment.trim().length > 0 ? [segment] : []),
  );
  const chipLabels = [
    profile.governorate ? governorateLabel(profile.governorate, ta) : null,
    profile.maritalStatus
      ? ti(`profile.maritalStatus.${profile.maritalStatus}`)
      : null,
    profile.occupation,
  ]
    .filter(
      (chip): chip is string =>
        chip !== null && chip !== undefined && chip.trim().length > 0,
    )
    .slice(0, 3);

  return (
    <header className="flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
      <div className="flex min-w-0 items-center gap-4">
        {/* Grid stacking: the rotated svg ring and the avatar share one cell. */}
        <div className="relative grid size-18 shrink-0 place-items-center sm:size-23">
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 size-full -rotate-90"
          >
            <circle
              cx={50}
              cy={50}
              r={46}
              fill="none"
              strokeWidth={2.5}
              className="stroke-border"
            />
            {/* Zero-length dashes render a stray round cap dot in some browsers. */}
            {percent > 0 ? (
              <circle
                cx={50}
                cy={50}
                r={46}
                fill="none"
                pathLength={100}
                stroke={levelColor}
                strokeDasharray={`${percent} ${100 - percent}`}
                strokeLinecap="round"
                strokeWidth={2.5}
              />
            ) : null}
          </svg>
          <Avatar className="col-start-1 row-start-1 size-16 sm:size-20">
            <AvatarFallback className="text-lg sm:text-xl">
              {getInitials(profile.fullName ?? "")}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="truncate text-xl font-semibold sm:text-2xl">
            {profile.fullName ?? "—"}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {subtitleSegments.length > 0 ? subtitleSegments.join(" · ") : "—"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="secondary"
              className={`tabular-nums ${LEVEL_TONE[level]}`}
            >
              <span aria-hidden="true">{percent}% {ti("profile.completeness.title")}</span>
              <span className="sr-only">
                {ti("profile.completeness.title")}: {percent}%
              </span>
            </Badge>
            {chipLabels.map((chip, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: chip labels may repeat; position disambiguates
              <Badge key={`${chip}-${index}`} variant="outline">
                {chip}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        aria-pressed={editing}
        onClick={onToggleEditing}
        className="shrink-0 self-start md:self-auto"
      >
        {editing ? ti("profile.cancel") : ti("profile.edit")}
      </Button>
    </header>
  );
}
