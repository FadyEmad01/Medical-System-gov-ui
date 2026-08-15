import { describe, expect, it } from "vitest";
import type { DependentResponseDto } from "../../enrollment/types";
import type { CardResponseDto } from "../../types";
import { resolveBeneficiaryType } from "./beneficiary-type";

function makeCard(overrides: Partial<CardResponseDto> = {}): CardResponseDto {
  return {
    id: "card-1",
    patientId: 1,
    status: "Active",
    isCurrentlyValid: true,
    issueReason: "Dependent",
    version: 1,
    tokenVersion: 1,
    isLatestCard: true,
    issuedAt: "2026-08-01T00:00:00Z",
    expiresAt: "2027-08-01T00:00:00Z",
    applicationId: "app-1",
    createdAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

function makeDependent(
  overrides: Partial<DependentResponseDto> = {},
): DependentResponseDto {
  return {
    dependentPersonId: "dependent-1",
    fullName: null,
    dateOfBirth: "2015-01-01T00:00:00Z",
    gender: "Male",
    nationalId: null,
    status: "Active",
    relationshipId: "relationship-1",
    relationshipType: "Child",
    isPrimarySponsor: false,
    startedAt: "2026-08-01T00:00:00Z",
    endedAt: null,
    isActive: true,
    correlationId: "correlation-1",
    ...overrides,
  };
}

describe("resolveBeneficiaryType", () => {
  it("returns head of household for a null card", () => {
    expect(resolveBeneficiaryType(null, [])).toBe("رب الأسرة");
  });

  it("returns head of household for an undefined card", () => {
    expect(resolveBeneficiaryType(undefined, [])).toBe("رب الأسرة");
  });

  it("returns head of household when the card has no dependentPersonId", () => {
    const card = makeCard({ dependentPersonId: undefined });
    expect(resolveBeneficiaryType(card, [])).toBe("رب الأسرة");
  });

  it("returns the child label for a matching Child dependent", () => {
    const card = makeCard({ dependentPersonId: "dependent-1" });
    const dependents = [makeDependent()];
    expect(resolveBeneficiaryType(card, dependents)).toBe("طفل");
  });

  it("returns the spouse label for a matching Spouse dependent", () => {
    const card = makeCard({ dependentPersonId: "dependent-2" });
    const dependents = [
      makeDependent({
        dependentPersonId: "dependent-2",
        relationshipType: "Spouse",
      }),
    ];
    expect(resolveBeneficiaryType(card, dependents)).toBe("زوج/زوجة");
  });

  it("returns the parent label for a matching Parent dependent", () => {
    const card = makeCard({ dependentPersonId: "dependent-3" });
    const dependents = [
      makeDependent({
        dependentPersonId: "dependent-3",
        relationshipType: "Parent",
      }),
    ];
    expect(resolveBeneficiaryType(card, dependents)).toBe("والد/والدة");
  });

  it("returns the guardian label for a matching Guardian dependent", () => {
    const card = makeCard({ dependentPersonId: "dependent-4" });
    const dependents = [
      makeDependent({
        dependentPersonId: "dependent-4",
        relationshipType: "Guardian",
      }),
    ];
    expect(resolveBeneficiaryType(card, dependents)).toBe("ولي أمر");
  });

  it("returns an em dash when no dependent matches the card", () => {
    const card = makeCard({ dependentPersonId: "dependent-missing" });
    const dependents = [makeDependent()];
    expect(resolveBeneficiaryType(card, dependents)).toBe("—");
  });

  it("returns an em dash when dependents is undefined", () => {
    const card = makeCard({ dependentPersonId: "dependent-1" });
    expect(resolveBeneficiaryType(card, undefined)).toBe("—");
  });

  it("resolves by dependentPersonId, not by array position", () => {
    const card = makeCard({ dependentPersonId: "dependent-5" });
    const dependents = [
      makeDependent(),
      makeDependent({
        dependentPersonId: "dependent-5",
        relationshipType: "Spouse",
      }),
    ];
    expect(resolveBeneficiaryType(card, dependents)).toBe("زوج/زوجة");
  });
});
