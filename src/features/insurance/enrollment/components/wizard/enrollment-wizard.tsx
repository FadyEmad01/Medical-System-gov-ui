"use client";

import { useTranslations } from "next-intl";
import { Fragment, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { useRouter } from "@/i18n/navigation";
import { isAuthActionError } from "../../../hooks/session-guard";
import { useProfile } from "../../../hooks/use-profile";
import { useCurrentEnrollment, useReadiness } from "../../hooks/use-enrollment";
import {
  deriveInitialWizardStep,
  type WizardStep,
} from "../../lib/derive-wizard-step";
import { DependentsStep } from "./dependents-step";
import { DocumentsStep } from "./documents-step";
import { EligibilityStep } from "./eligibility-step";
import { ProfileStep } from "./profile-step";
import { ReviewStep } from "./review-step";

const STEP_ORDER: readonly WizardStep[] = [
  "eligibility",
  "profile",
  "documents",
  "dependents",
  "review",
];

function stepIndexOf(step: WizardStep): number {
  return STEP_ORDER.indexOf(step);
}

/**
 * Maps a wizard load error to an insurance translation key. `unauthorized`
 * (401) means the session is dead; `forbidden` (403) means the user is signed
 * in but lacks permission — both are terminal, so no retry is offered.
 */
function errorMessageKey(error: unknown): string {
  if (!isAuthActionError(error)) return "errors.generic";
  if (error.kind === "unauthorized") return "errors.sessionExpired";
  if (error.kind === "forbidden") return "errors.forbidden";
  if (error.kind === "notFound") return "errors.notFound";
  return "errors.generic";
}

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
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{t("enrollment.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("enrollment.applicationNumber", {
            number: enrollment.applicationNumber,
          })}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <Stepper
          className="items-center"
          value={stepIndex}
          onValueChange={setStepIndex}
        >
          {STEP_ORDER.map((currentStep, index) => (
            <Fragment key={currentStep}>
              <StepperItem step={index}>
                <StepperTrigger className="rounded-full">
                  <StepperIndicator />
                  <div className="hidden flex-col items-start text-start sm:flex">
                    <StepperTitle>
                      {t(`enrollment.steps.${currentStep}`)}
                    </StepperTitle>
                  </div>
                </StepperTrigger>
              </StepperItem>
              {index < STEP_ORDER.length - 1 ? <StepperSeparator /> : null}
            </Fragment>
          ))}
        </Stepper>

        {step === "eligibility" ? (
          <EligibilityStep enrollment={enrollment} readiness={readiness} />
        ) : null}
        {step === "profile" ? (
          <ProfileStep profile={profile} readiness={readiness} />
        ) : null}
        {step === "documents" ? (
          <DocumentsStep patientId={profile.patientId} />
        ) : null}
        {step === "dependents" ? (
          <DependentsStep patientId={profile.patientId} />
        ) : null}
        {step === "review" ? (
          <ReviewStep
            readiness={readiness}
            applicationCreatedAt={enrollment.createdAt}
            onBack={() => setStepIndex((index) => index - 1)}
          />
        ) : null}

        {stepIndex < STEP_ORDER.length - 1 ? (
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((index) => index - 1)}
            >
              {t("enrollment.back")}
            </Button>
            <Button
              type="button"
              onClick={() => setStepIndex((index) => index + 1)}
            >
              {t("enrollment.next")}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
