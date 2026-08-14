import { describe, expect, it } from "vitest";
import { addDependentSchema, toAddDependentRequest } from "./dependent-form";

const validValues = {
  firstName: "  Sara ",
  secondName: "Ali",
  thirdName: "Hassan",
  fourthName: "Mohamed",
  dateOfBirth: "2010-05-12",
  gender: "Female" as const,
  relationshipType: "Child" as const,
  nationalId: "12345678901234",
};

describe("addDependentSchema", () => {
  it("accepts valid values and trims name parts", () => {
    const parsed = addDependentSchema.parse(validValues);
    expect(parsed.firstName).toBe("Sara");
  });

  it("rejects missing name parts", () => {
    const result = addDependentSchema.safeParse({
      ...validValues,
      secondName: "   ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "dependents.errors.invalidName",
      );
    }
  });

  it("rejects name parts longer than 50 characters", () => {
    const result = addDependentSchema.safeParse({
      ...validValues,
      firstName: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing date of birth", () => {
    const result = addDependentSchema.safeParse({
      ...validValues,
      dateOfBirth: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "dependents.errors.dateOfBirthRequired",
      );
    }
  });

  it("rejects unknown enum values", () => {
    expect(
      addDependentSchema.safeParse({
        ...validValues,
        gender: "Other",
      }).success,
    ).toBe(false);
    expect(
      addDependentSchema.safeParse({
        ...validValues,
        relationshipType: "Sibling",
      }).success,
    ).toBe(false);
  });

  it("rejects a malformed national ID", () => {
    const result = addDependentSchema.safeParse({
      ...validValues,
      nationalId: "12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "dependents.errors.nationalId",
      );
    }
  });

  it("accepts an empty national ID", () => {
    expect(
      addDependentSchema.safeParse({
        ...validValues,
        nationalId: "",
      }).success,
    ).toBe(true);
  });
});

describe("toAddDependentRequest", () => {
  it("omits an empty national ID from the payload", () => {
    const request = toAddDependentRequest({
      ...validValues,
      nationalId: "",
    });
    expect(request).not.toHaveProperty("nationalId");
  });

  it("keeps a provided national ID", () => {
    const request = toAddDependentRequest(validValues);
    expect(request.nationalId).toBe("12345678901234");
  });
});
