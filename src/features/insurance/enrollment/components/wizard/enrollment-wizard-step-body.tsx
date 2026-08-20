"use client";

import type { ProfileResponseDto } from "../../../types";
import type { WizardStep } from "../../lib/derive-wizard-step";
import type {
  EnrollmentReadinessResponseDto,
  EnrollmentResponseDto,
} from "../../types";
import { DependentsStep } from "./dependents-step";
import { DocumentsStep } from "./documents-step";
import { EligibilityStep } from "./eligibility-step";
import { ProfileStep } from "./profile-step";
import { ReviewStep } from "./review-step";

/** Renders the active wizard step body. */
export function EnrollmentWizardStepBody({
  step,
  profile,
  enrollment,
  readiness,
  onBack,
}: {
  step: WizardStep;
  profile: ProfileResponseDto;
  enrollment: EnrollmentResponseDto;
  readiness: EnrollmentReadinessResponseDto;
  onBack: () => void;
}) {
  if (step === "eligibility") {
    return <EligibilityStep enrollment={enrollment} readiness={readiness} />;
  }
  if (step === "profile") {
    return <ProfileStep profile={profile} readiness={readiness} />;
  }
  if (step === "documents") {
    return <DocumentsStep patientId={profile.patientId} />;
  }
  if (step === "dependents") {
    return <DependentsStep patientId={profile.patientId} />;
  }
  if (step === "review") {
    return (
      <ReviewStep
        readiness={readiness}
        applicationCreatedAt={enrollment.createdAt}
        onBack={onBack}
      />
    );
  }
  return null;
}
