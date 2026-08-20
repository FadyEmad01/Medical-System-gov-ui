"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "@/i18n/navigation";
import { isAuthActionError } from "../../../hooks/session-guard";
import { useProfile } from "../../../hooks/use-profile";
import { errorMessageKey } from "../../../lib/error-message-key";
import { useCurrentEnrollment, useReadiness } from "../../hooks/use-enrollment";
import { deriveInitialWizardStep } from "../../lib/derive-wizard-step";
import {
  EnrollmentWizardChrome,
  STEP_ORDER,
  stepIndexOf,
} from "./enrollment-wizard-chrome";
import { EnrollmentWizardStepBody } from "./enrollment-wizard-step-body";

/** True when a retry could heal the load error (everything but auth states). */
function isRetryableError(error: unknown): boolean {
  if (!isAuthActionError(error)) return true;
  return error.kind !== "unauthorized" && error.kind !== "forbidden";
}

/**
 * The enrollment wizard: eligibility → profile → documents → dependents →
 * review.
 *
 * The stepper is fully navigable (the patient may jump between sections),
 * and the readiness snapshot decides where a returning patient resumes:
 * sections that are already complete are skipped forward, never backwards.
 * A draft that was already submitted (or cancelled) redirects to the
 * tracking page instead of rendering the wizard.
 */
export function EnrollmentWizardPage() {
  const t = useTranslations("insurance");
  const router = useRouter();
  const profileQuery = useProfile();
  const enrollmentQuery = useCurrentEnrollment();
  const readinessQuery = useReadiness();
  const [stepIndex, setStepIndex] = useState(0);

  const profile = profileQuery.data;
  const enrollment = enrollmentQuery.data;
  const readiness = readinessQuery.data;

  // A dead session clears the identity cache here and lets AuthGuard redirect;
  // other load failures get a retryable error card below.
  const loadError =
    profileQuery.error ?? enrollmentQuery.error ?? readinessQuery.error;

  // Resume: jump forward to the first incomplete section once readiness is
  // known. Forward-only — the patient never loses their current position.
  useEffect(() => {
    if (!readiness) return;
    const target = stepIndexOf(deriveInitialWizardStep(readiness));
    setStepIndex((prev) => Math.max(prev, target));
  }, [readiness]);

  // Redirect when there is nothing to edit here: no enrollment at all (back
  // to the landing page) or an enrollment past the Draft stage (tracking).
  // A failed query must never redirect — its error card renders instead, and
  // `data` is undefined (loosely `== null`) while `isError` is true.
  useEffect(() => {
    if (enrollmentQuery.isPending || readinessQuery.isPending) return;
    if (enrollmentQuery.isError || readinessQuery.isError) return;
    if (enrollment == null || readiness == null) {
      router.replace("/dashboard/insurance");
      return;
    }
    if (enrollment.applicationStatus !== "Draft") {
      router.replace("/dashboard/insurance/track");
    }
  }, [
    enrollment,
    enrollmentQuery.isError,
    enrollmentQuery.isPending,
    readiness,
    readinessQuery.isError,
    readinessQuery.isPending,
    router,
  ]);

  if (loadError) {
    return (
      <Card className="mx-auto w-full max-w-3xl">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {t(errorMessageKey(loadError))}
          </p>
          {isRetryableError(loadError) ? (
            <Button
              variant="outline"
              onClick={() => {
                void profileQuery.refetch();
                void enrollmentQuery.refetch();
                void readinessQuery.refetch();
              }}
            >
              {t("enrollment.retry")}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (
    profileQuery.isPending ||
    enrollmentQuery.isPending ||
    readinessQuery.isPending ||
    profile == null ||
    enrollment == null ||
    readiness == null ||
    enrollment.applicationStatus !== "Draft"
  ) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const step = STEP_ORDER[stepIndex];

  return (
    <EnrollmentWizardChrome
      applicationNumber={enrollment.applicationNumber}
      stepIndex={stepIndex}
      onStepIndexChange={setStepIndex}
    >
      <EnrollmentWizardStepBody
        step={step}
        profile={profile}
        enrollment={enrollment}
        readiness={readiness}
        onBack={() => setStepIndex((index) => index - 1)}
      />
    </EnrollmentWizardChrome>
  );
}
