import { describe, expect, it } from "vitest";
import {
  PROFILE_GATE_FIELDS,
  type ProfileGateField,
  type ProfileResponseDto,
} from "../types";
import { computeProfileCompleteness } from "./completeness";

type GateProfile = Pick<ProfileResponseDto, ProfileGateField>;

function profileWith(
  fields: Partial<Record<ProfileGateField, string | null | undefined>>,
): GateProfile {
  return fields as GateProfile;
}

const FULL_PROFILE: GateProfile = {
  occupation: "Engineer",
  maritalStatus: "Married",
  nationality: "Egyptian",
  emergencyContactName: "Sara Hassan",
  emergencyContactPhone: "01001234567",
};

describe("computeProfileCompleteness", () => {
  it("reports 0% / low for a null profile with every field missing", () => {
    const result = computeProfileCompleteness(null);

    expect(result).toEqual({
      percent: 0,
      filled: 0,
      total: 5,
      missing: PROFILE_GATE_FIELDS,
      level: "low",
    });
  });

  it("treats an undefined profile the same as null", () => {
    const result = computeProfileCompleteness(undefined);

    expect(result.filled).toBe(0);
    expect(result.percent).toBe(0);
    expect(result.missing).toEqual(PROFILE_GATE_FIELDS);
    expect(result.level).toBe("low");
  });

  it("reports 0% / low when every field is null", () => {
    const result = computeProfileCompleteness(
      profileWith({
        occupation: null,
        maritalStatus: null,
        nationality: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
      }),
    );

    expect(result.percent).toBe(0);
    expect(result.filled).toBe(0);
    expect(result.missing).toEqual(PROFILE_GATE_FIELDS);
    expect(result.level).toBe("low");
  });

  it("reports 20% / low with one field filled", () => {
    const result = computeProfileCompleteness(
      profileWith({ occupation: "Engineer" }),
    );

    expect(result.percent).toBe(20);
    expect(result.filled).toBe(1);
    expect(result.missing).toEqual([
      "maritalStatus",
      "nationality",
      "emergencyContactName",
      "emergencyContactPhone",
    ]);
    expect(result.level).toBe("low");
  });

  it("reports 40% / low with two fields filled", () => {
    const result = computeProfileCompleteness(
      profileWith({ occupation: "Engineer", maritalStatus: "Married" }),
    );

    expect(result.percent).toBe(40);
    expect(result.filled).toBe(2);
    expect(result.level).toBe("low");
  });

  it("reports 60% / medium with three fields filled", () => {
    const result = computeProfileCompleteness(
      profileWith({
        occupation: "Engineer",
        maritalStatus: "Married",
        nationality: "Egyptian",
      }),
    );

    expect(result.percent).toBe(60);
    expect(result.filled).toBe(3);
    expect(result.level).toBe("medium");
  });

  it("reports 80% / high with four fields filled", () => {
    const result = computeProfileCompleteness(
      profileWith({
        occupation: "Engineer",
        maritalStatus: "Married",
        nationality: "Egyptian",
        emergencyContactName: "Sara Hassan",
      }),
    );

    expect(result.percent).toBe(80);
    expect(result.filled).toBe(4);
    expect(result.missing).toEqual(["emergencyContactPhone"]);
    expect(result.level).toBe("high");
  });

  it("reports 100% / high with every field filled", () => {
    const result = computeProfileCompleteness(FULL_PROFILE);

    expect(result.percent).toBe(100);
    expect(result.filled).toBe(5);
    expect(result.missing).toEqual([]);
    expect(result.level).toBe("high");
  });

  it("does not count empty or whitespace-only strings as filled", () => {
    const result = computeProfileCompleteness(
      profileWith({
        occupation: "   ",
        maritalStatus: "Married",
        nationality: "Egyptian",
        emergencyContactName: "Sara Hassan",
        emergencyContactPhone: "",
      }),
    );

    expect(result.filled).toBe(3);
    expect(result.missing).toEqual(["occupation", "emergencyContactPhone"]);
    expect(result.percent).toBe(60);
    expect(result.level).toBe("medium");
  });
});
