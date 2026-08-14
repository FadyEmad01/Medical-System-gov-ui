import { describe, expect, it } from "vitest";
import type { ApplicationStatus } from "../../types";
import type { EnrollmentReadinessResponseDto } from "../types";
import {
  deriveInitialWizardStep,
  deriveTrackingPanel,
} from "./derive-wizard-step";

function readiness(
  overrides: Partial<EnrollmentReadinessResponseDto> = {},
): EnrollmentReadinessResponseDto {
  return {
    isReady: true,
    missingRequirements: [],
    missingDocumentTypes: [],
    isEligibleForCategory: true,
    eligibilityViolations: [],
    profileComplete: true,
    dependentsValid: true,
    documentsComplete: true,
    applicationExists: false,
    ...overrides,
  };
}

describe("deriveInitialWizardStep", () => {
  it("resumes at review when the enrollment is fully ready", () => {
    expect(deriveInitialWizardStep(readiness())).toBe("review");
  });

  it("stops at eligibility when the category is ineligible", () => {
    expect(
      deriveInitialWizardStep(readiness({ isEligibleForCategory: false })),
    ).toBe("eligibility");
  });

  it("stops at eligibility when there are eligibility violations", () => {
    expect(
      deriveInitialWizardStep(
        readiness({ eligibilityViolations: ["category has a minimum age"] }),
      ),
    ).toBe("eligibility");
  });

  it("stops at profile when the profile is incomplete", () => {
    expect(deriveInitialWizardStep(readiness({ profileComplete: false }))).toBe(
      "profile",
    );
  });

  it("stops at documents when documents are incomplete", () => {
    expect(
      deriveInitialWizardStep(readiness({ documentsComplete: false })),
    ).toBe("documents");
  });

  it("stops at dependents when dependents are invalid", () => {
    expect(deriveInitialWizardStep(readiness({ dependentsValid: false }))).toBe(
      "dependents",
    );
  });
});

describe("deriveTrackingPanel", () => {
  it("maps every application status to its tracking panel", () => {
    const cases: Array<[ApplicationStatus, string]> = [
      ["Draft", "draft"],
      ["Submitted", "submitted"],
      ["UnderReview", "under-review"],
      ["WaitingForDocuments", "waiting-documents"],
      ["Approved", "approved"],
      ["Rejected", "rejected"],
      ["Cancelled", "cancelled"],
    ];

    for (const [status, panel] of cases) {
      expect(deriveTrackingPanel(status)).toBe(panel);
    }
  });
});
