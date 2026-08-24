"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

/** Resolves a backend governorate name to its localized label, else passthrough. */
export function governorateLabel(value: string, ta: Translator): string {
  const key = GOVERNORATE_KEY_BY_NAME[value.toLowerCase()];
  return key ? ta(key) : value;
}

/** Formats an ISO date as PPP in the active locale; invalid input passes through. */
export function formatIsoDate(
  value: string | undefined,
  locale: string,
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
}

export interface DetailRow {
  key: string;
  label: string;
  value: string | null;
}

/**
 * Builds every profile detail row (label already localized, value already
 * formatted). The single source both the Overview key facts and the Details
 * tab render from.
 */
export function useProfileRows(
  profile: ProfileResponseDto,
): Record<string, DetailRow> {
  const ta = useTranslations("auth");
  const ti = useTranslations("insurance");
  const locale = useLocale();

  const identity = (key: string) => ti(`profile.identity.${key}`);
  const rows: DetailRow[] = [
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

  return Object.fromEntries(rows.map((row) => [row.key, row]));
}

/** One dt/dd pair; identical anatomy everywhere profile data is listed. */
function ProfileRow({ row, action }: { row: DetailRow; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{row.label}</dt>
      <dd className="text-sm">
        {row.value ? (
          action ? (
            <span className="flex flex-wrap items-center gap-1.5">
              {row.value}
              {action}
            </span>
          ) : (
            row.value
          )
        ) : (
          <span aria-hidden="true" className="text-muted-foreground">
            —
          </span>
        )}
      </dd>
    </div>
  );
}

/** Row keys surfaced on the Overview tab's "Key facts" grid. */
const KEY_FACT_ROW_KEYS = [
  "occupation",
  "governorate",
  "district",
  "maritalStatus",
  "nationality",
  "preferredLanguage",
] as const;

export function ProfileKeyFacts({ profile }: { profile: ProfileResponseDto }) {
  const ti = useTranslations("insurance");
  const rows = useProfileRows(profile);

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{ti("profile.sections.keyFacts")}</h3>
      <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
        {KEY_FACT_ROW_KEYS.map((key) => (
          <ProfileRow key={key} row={rows[key]} />
        ))}
      </dl>
    </section>
  );
}

/** Details-tab layout: grouped sections rendered top to bottom. */
const DETAIL_SECTIONS = [
  {
    key: "identity",
    rowKeys: [
      "fullName",
      "nationalId",
      "dateOfBirth",
      "gender",
      "nationality",
      "maritalStatus",
      "createdAt",
    ],
  },
  {
    key: "contact",
    rowKeys: [
      "mobileNumber",
      "email",
      "governorate",
      "district",
      "address",
      "occupation",
      "preferredLanguage",
    ],
  },
  {
    key: "emergency",
    rowKeys: ["emergencyContactName", "emergencyContactPhone"],
  },
] as const;

export function ProfileDetails({ profile }: { profile: ProfileResponseDto }) {
  const ti = useTranslations("insurance");
  const rows = useProfileRows(profile);

  return (
    <div className="flex flex-col gap-6">
      {DETAIL_SECTIONS.map((section, index) => (
        <Fragment key={section.key}>
          {index > 0 ? <Separator /> : null}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">
              {ti(`profile.sections.${section.key}`)}
            </h2>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {section.rowKeys.map((key) => (
                <ProfileRow
                  key={key}
                  row={rows[key]}
                  action={
                    key === "nationalId" ? (
                      <Badge variant="outline">{ti("profile.private")}</Badge>
                    ) : undefined
                  }
                />
              ))}
            </dl>
          </section>
        </Fragment>
      ))}
    </div>
  );
}
