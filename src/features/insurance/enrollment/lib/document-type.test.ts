import { describe, expect, it } from "vitest";
import {
  DOCUMENT_TYPE_ICON,
  DOCUMENT_TYPE_LABEL_KEY,
  DOCUMENT_TYPE_ORDER,
} from "./document-type";

const EXPECTED_ORDER = [
  "NationalId",
  "BirthCertificate",
  "MarriageCertificate",
  "EmploymentLetter",
  "DisabilityCertificate",
  "DeathCertificate",
  "GuardianAuthorization",
  "FamilyRegistration",
] as const;

describe("document type metadata", () => {
  it("orders the eight document types without duplicates", () => {
    expect(DOCUMENT_TYPE_ORDER).toEqual(EXPECTED_ORDER);
    expect(new Set(DOCUMENT_TYPE_ORDER).size).toBe(DOCUMENT_TYPE_ORDER.length);
  });

  it("labels every type with an i18n key under documents.types", () => {
    for (const type of DOCUMENT_TYPE_ORDER) {
      expect(DOCUMENT_TYPE_LABEL_KEY[type]).toMatch(/^documents\.types\./);
    }
  });

  it("maps every type to an icon component", () => {
    for (const type of DOCUMENT_TYPE_ORDER) {
      // React 19 forwardRef returns an object ({ $$typeof, render }), not a
      // function, so each entry is verified as a defined component.
      expect(DOCUMENT_TYPE_ICON[type]).toBeDefined();
    }
  });

  it("exposes exactly the eight label keys added to the translations", () => {
    expect(Object.values(DOCUMENT_TYPE_LABEL_KEY)).toEqual([
      "documents.types.nationalId",
      "documents.types.birthCertificate",
      "documents.types.marriageCertificate",
      "documents.types.employmentLetter",
      "documents.types.disabilityCertificate",
      "documents.types.deathCertificate",
      "documents.types.guardianAuthorization",
      "documents.types.familyRegistration",
    ]);
  });
});
