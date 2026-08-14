import { describe, expect, it } from "vitest";
import { maskNationalId } from "./dependent-display";

describe("maskNationalId", () => {
  it("returns an empty string for null and undefined", () => {
    expect(maskNationalId(null)).toBe("");
    expect(maskNationalId(undefined)).toBe("");
  });

  it("keeps the last four digits of a full national ID", () => {
    expect(maskNationalId("12345678901234")).toBe("••••••••••1234");
  });

  it("masks short values entirely", () => {
    expect(maskNationalId("1234")).toBe("••••");
    expect(maskNationalId("12")).toBe("••");
  });
});
