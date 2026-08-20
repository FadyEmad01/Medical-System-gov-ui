import { describe, expect, it } from "vitest";
import { parsePatientId } from "./parse-patient-id";

describe("parsePatientId", () => {
  it("returns null for empty or whitespace", () => {
    expect(parsePatientId("")).toBeNull();
    expect(parsePatientId("   ")).toBeNull();
  });

  it("parses positive integers", () => {
    expect(parsePatientId("1")).toBe(1);
    expect(parsePatientId("42")).toBe(42);
    expect(parsePatientId(" 99 ")).toBe(99);
  });

  it("rejects zero, negatives, and non-integers", () => {
    expect(parsePatientId("0")).toBeNull();
    expect(parsePatientId("-3")).toBeNull();
    expect(parsePatientId("1.5")).toBeNull();
    expect(parsePatientId("abc")).toBeNull();
    expect(parsePatientId("12abc")).toBeNull();
  });
});
