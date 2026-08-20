"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { ProfileResponseDto } from "../../../types";
import { DOCUMENT_TYPE_ICON, DOCUMENT_TYPE_LABEL_KEY } from "../../lib/document-type";
import type { DependentResponseDto, DocumentType } from "../../types";

export function ReviewDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

/** Compact two-column dl of the summary profile's key fields. */
export function ProfileSummary({ profile }: { profile: ProfileResponseDto }) {
  const t = useTranslations("insurance");
  const identity = (key: string) => t(`profile.identity.${key}`);
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
    { key: "email", label: identity("email"), value: profile.email ?? null },
    {
      key: "occupation",
      label: identity("occupation"),
      value: profile.occupation ?? null,
    },
    {
      key: "maritalStatus",
      label: t("profile.field.maritalStatus"),
      value: profile.maritalStatus
        ? t(`profile.maritalStatus.${profile.maritalStatus}`)
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
  ];

  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.key} className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{row.label}</dt>
          <dd className="text-sm">
            {row.value ?? (
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

/** Readable dependent name: fullName, or gender · relationship fallback. */
export function dependentName(
  dependent: DependentResponseDto,
  t: (key: string) => string,
): string {
  if (dependent.fullName) return dependent.fullName;
  return `${t(`dependents.gender.${dependent.gender}`)} · ${t(
    `dependents.relationship.${dependent.relationshipType}`,
  )}`;
}

/** Outline badges for the document types the readiness snapshot is missing. */
export function DocumentTypeBadges({
  types,
  label,
}: {
  types: DocumentType[];
  label: string;
}) {
  const t = useTranslations("insurance");

  if (types.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {types.map((type) => {
          const Icon = DOCUMENT_TYPE_ICON[type];
          const labelKey = DOCUMENT_TYPE_LABEL_KEY[type];
          return (
            <Badge key={type} variant="outline">
              <Icon data-icon="inline-start" />
              {t.has(labelKey) ? t(labelKey) : type}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
