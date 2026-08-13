"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { GOVERNORATE_OPTIONS } from "@/features/auth/constants/register-options";
import type { ProfileResponseDto } from "../../types";

const GOVERNORATE_KEY_BY_NAME: Record<string, string> = Object.fromEntries(
  GOVERNORATE_OPTIONS.map((option) => [
    option.value.toLowerCase(),
    option.label,
  ]),
);

/** The subset of the next-intl translator the helpers need. */
interface Translator {
  (key: string): string;
  has: (key: string) => boolean;
}

function governorateLabel(value: string, ta: Translator): string {
  const key = GOVERNORATE_KEY_BY_NAME[value.toLowerCase()];
  return key ? ta(key) : value;
}

function formatIsoDate(
  value: string | undefined,
  locale: string,
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
}

export function ProfileDetails({ profile }: { profile: ProfileResponseDto }) {
  const ta = useTranslations("auth");
  const ti = useTranslations("insurance");
  const locale = useLocale();

  const identity = (key: string) => ti(`profile.identity.${key}`);
  const rows: Array<{ key: string; label: string; value: string | null }> = [
    {
      key: "fullName",
      label: identity("fullName"),
      value: profile.fullName ?? null,
    },
    {
      key: "nationalId",
      label: identity("nationalId"),
      value: profile.nationalId ?? null,
    },
    {
      key: "dateOfBirth",
      label: ta("dateOfBirth"),
      value: formatIsoDate(profile.dateOfBirth, locale),
    },
    {
      key: "gender",
      label: ta("gender"),
      value: profile.gender
        ? ta(profile.gender === "Male" ? "male" : "female")
        : null,
    },
    {
      key: "mobileNumber",
      label: ta("mobileNumber"),
      value: profile.mobileNumber ?? null,
    },
    {
      key: "email",
      label: identity("email"),
      value: profile.email ?? null,
    },
    {
      key: "governorate",
      label: ta("governorate"),
      value: profile.governorate
        ? governorateLabel(profile.governorate, ta)
        : null,
    },
    {
      key: "district",
      label: ta("district"),
      value: profile.district ?? null,
    },
    {
      key: "address",
      label: ta("address"),
      value: profile.address ?? null,
    },
    {
      key: "occupation",
      label: identity("occupation"),
      value: profile.occupation ?? null,
    },
    {
      key: "maritalStatus",
      label: ti("profile.field.maritalStatus"),
      value: profile.maritalStatus
        ? ti(`profile.maritalStatus.${profile.maritalStatus}`)
        : null,
    },
    {
      key: "nationality",
      label: identity("nationality"),
      value: profile.nationality ?? null,
    },
    {
      key: "preferredLanguage",
      label: identity("preferredLanguage"),
      value: profile.preferredLanguage ?? null,
    },
    {
      key: "emergencyContactName",
      label: identity("emergencyContactName"),
      value: profile.emergencyContactName ?? null,
    },
    {
      key: "emergencyContactPhone",
      label: identity("emergencyContactPhone"),
      value: profile.emergencyContactPhone ?? null,
    },
    {
      key: "createdAt",
      label: identity("createdAt"),
      value: formatIsoDate(profile.createdAt, locale),
    },
  ];

  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.key} className="flex flex-col gap-1">
          <dt className="text-xs font-medium text-muted-foreground">
            {row.label}
          </dt>
          <dd className="text-sm">
            {row.value ? (
              row.value
            ) : (
              <span aria-hidden="true" className="text-muted-foreground">
                —
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
