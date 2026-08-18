"use client";

import { ShieldCheck, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { checkEligibilityAction, recordVerificationAction } from "../actions";
import {
  ELIGIBILITY_STATUSES,
  VERIFICATION_CONTEXTS,
  VERIFICATION_STATUSES,
} from "../lib/constants";
import { RecordDecisionCard } from "./record-decision-card";
import { VerifyCardCard } from "./verify-card-card";

/**
 * The Admin verification workbench: verify a scanned card token, record an
 * insurance verification, or record an eligibility decision. The review
 * screen links here with ?patientId= pre-filled.
 *
 * The two record tools are configurations of the shared RecordDecisionCard —
 * same fields, same lifecycle, different status enums (+ context for
 * verification decisions).
 */
export default function VerificationPage() {
  const t = useTranslations("admin");

  return (
    <div className="flex flex-col gap-4">
      <VerifyCardCard />
      <div className="grid gap-4 lg:grid-cols-2">
        <RecordDecisionCard
          contexts={VERIFICATION_CONTEXTS.map((value) => ({
            value,
            label: t(`verification.contexts.${value}`),
          }))}
          descriptionKey="verification.insurance.description"
          icon={ShieldCheck}
          idPrefix="ver"
          statusLabel={(status) => t(`verification.statuses.${status}`)}
          statuses={VERIFICATION_STATUSES}
          submit={async (input) => {
            const res = await recordVerificationAction({
              patientId: input.patientId,
              status: input.status,
              // Options come from VERIFICATION_CONTEXTS — same closed set.
              context: (input.context ?? "Appointment") as Parameters<
                typeof recordVerificationAction
              >[0]["context"],
              reason: input.reason,
              remarks: input.remarks,
            });
            if (!res.ok) throw res.error;
            return res.data;
          }}
          titleKey="verification.insurance.title"
        />
        <RecordDecisionCard
          descriptionKey="verification.eligibility.description"
          icon={UserCheck}
          idPrefix="elig"
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
      </div>
      <p className="text-xs text-muted-foreground">
        {t("verification.doctorNote")}
      </p>
    </div>
  );
}
