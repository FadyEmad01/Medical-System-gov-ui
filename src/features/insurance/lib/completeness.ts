import {
  PROFILE_GATE_FIELDS,
  type ProfileGateField,
  type ProfileResponseDto,
} from "../types";

export type CompletenessLevel = "low" | "medium" | "high";

export interface ProfileCompleteness {
  percent: number;
  filled: number;
  total: number;
  missing: ProfileGateField[];
  level: CompletenessLevel;
}

/**
 * Computes how complete a patient profile is against the insurance gate
 * fields. Pure + deterministic: the same profile always yields the same result.
 *
 * A field counts as filled when it is non-null, non-undefined, and its trimmed
 * string is non-empty. `null`/`undefined`/missing profile → 0% (low).
 */
export function computeProfileCompleteness(
  profile: Pick<ProfileResponseDto, ProfileGateField> | null | undefined,
): ProfileCompleteness {
  const total = PROFILE_GATE_FIELDS.length;
  const missing = PROFILE_GATE_FIELDS.filter(
    (field) => !isFilled(profile?.[field]),
  );
  const filled = total - missing.length;
  const percent = Math.round((filled / total) * 100);

  return {
    percent,
    filled,
    total,
    missing,
    level: levelForPercent(percent),
  };
}

function isFilled(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  return value.trim().length > 0;
}

function levelForPercent(percent: number): CompletenessLevel {
  if (percent < 50) return "low";
  if (percent < 80) return "medium";
  return "high";
}
