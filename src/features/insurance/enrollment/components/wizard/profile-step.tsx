"use client";

import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProfileEditForm } from "../../../profile/components/profile-edit-form";
import type { ProfileResponseDto } from "../../../types";
import type { EnrollmentReadinessResponseDto } from "../../types";

/**
 * Step 2 — profile. Renders a compact read-only summary with an edit toggle
 * that reuses the shared `ProfileEditForm`. The backend's completeness gate
 * decides whether the hint alert is shown; saving invalidates both the
 * profile and the enrollment readiness snapshots.
 */
export function ProfileStep({
  profile,
  readiness,
}: {
  profile: ProfileResponseDto;
  readiness: EnrollmentReadinessResponseDto;
}) {
  const t = useTranslations("insurance");
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {!readiness.profileComplete ? (
        <Alert>
          <InfoIcon />
          <AlertTitle>{t("enrollment.profile.completenessHint")}</AlertTitle>
        </Alert>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-medium">
          {t("profile.title")}
        </h2>
        {!editing ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditing(true)}
          >
            {t("profile.edit")}
          </Button>
        ) : null}
      </div>

      {editing ? (
        <ProfileEditForm
          profile={profile}
          formRef={formRef}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      ) : (
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <ProfileDetail
            label={t("profile.identity.fullName")}
            value={profile.fullName ?? "—"}
          />
          <ProfileDetail
            label={t("profile.identity.nationalId")}
            value={profile.nationalId ?? "—"}
          />
          <ProfileDetail
            label={t("profile.field.maritalStatus")}
            value={
              profile.maritalStatus
                ? t(`profile.maritalStatus.${profile.maritalStatus}`)
                : "—"
            }
          />
          <ProfileDetail
            label={t("profile.field.occupation")}
            value={profile.occupation ?? "—"}
          />
          <ProfileDetail
            label={t("profile.field.nationality")}
            value={profile.nationality ?? "—"}
          />
        </dl>
      )}
    </div>
  );
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
