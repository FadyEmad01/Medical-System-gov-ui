"use client";

import { ShieldCheck, UserCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useMe } from "@/features/auth/hooks/use-me";
import { usePathname, useRouter } from "@/i18n/navigation";
import { parsePatientId } from "@/features/insurance/lib/parse-patient-id";
import {
  checkEligibilityAction,
  recordVerificationAction,
} from "@/features/insurance/verification/actions";
import {
  ELIGIBILITY_STATUSES,
  VERIFICATION_CONTEXTS,
  VERIFICATION_STATUSES,
} from "@/features/insurance/verification/lib/constants";
import type { VerificationContext } from "@/features/insurance/verification/lib/constants";
import { RecordDecisionCard } from "./record-decision-card";
import { VerifyCardCard } from "./verify-card-card";

/**
 * Admin verification workbench: verify a scanned card token, record an
 * insurance verification, or record an eligibility decision. Deep-link with
 * ?patientId= (e.g. from review) — both record cards share that value and
 * keep the URL in sync on blur / Load.
 */
export default function VerificationPage() {
  const t = useTranslations("admin");
  const { data: user } = useMe();
  const isAdmin = user?.role === "Admin";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [patientId, setPatientId] = useState(
    () => searchParams.get("patientId") ?? "",
  );

  const syncPatientIdToUrl = useCallback(
    (raw: string) => {
      const id = parsePatientId(raw);
      const params = new URLSearchParams(searchParams.toString());
      if (id === null) {
        params.delete("patientId");
      } else {
        params.set("patientId", String(id));
      }
      const nextId = id === null ? "" : String(id);
      const current = searchParams.get("patientId") ?? "";
      if (current === nextId) return;
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const onPatientIdChange = useCallback((value: string) => {
    setPatientId(value);
  }, []);

  const onPatientIdBlur = useCallback(() => {
    syncPatientIdToUrl(patientId);
  }, [patientId, syncPatientIdToUrl]);

  return (
    <div className="flex flex-col gap-4">
      <VerifyCardCard />
      <div className={`grid gap-4 ${isAdmin ? "lg:grid-cols-2" : ""}`}>
        <RecordDecisionCard
          contexts={VERIFICATION_CONTEXTS.map((value) => ({
            value,
            label: t(`verification.contexts.${value}`),
          }))}
          descriptionKey="verification.insurance.description"
          icon={ShieldCheck}
          idPrefix="ver"
          onPatientIdBlur={onPatientIdBlur}
          onPatientIdChange={onPatientIdChange}
          patientId={patientId}
          statusLabel={(status) => t(`verification.statuses.${status}`)}
          statuses={VERIFICATION_STATUSES}
          submit={async (input) => {
            const res = await recordVerificationAction({
              patientId: input.patientId,
              status: input.status,
              context: (input.context ?? "Appointment") as VerificationContext,
              reason: input.reason,
              remarks: input.remarks,
            });
            if (!res.ok) throw res.error;
            return res.data;
          }}
          titleKey="verification.insurance.title"
        />
        {isAdmin ? (
          <RecordDecisionCard
            descriptionKey="verification.eligibility.description"
            icon={UserCheck}
            idPrefix="elig"
            onPatientIdBlur={onPatientIdBlur}
            onPatientIdChange={onPatientIdChange}
            patientId={patientId}
            statusLabel={(status) =>
              t(`verification.eligibilityStatuses.${status}`)
            }
            statuses={ELIGIBILITY_STATUSES}
            submit={async (input) => {
              const res = await checkEligibilityAction({
                patientId: input.patientId,
                status: input.status,
                reason: input.reason,
                remarks: input.remarks,
              });
              if (!res.ok) throw res.error;
              return res.data;
            }}
            titleKey="verification.eligibility.title"
          />
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("verification.doctorNote")}
      </p>
    </div>
  );
}
