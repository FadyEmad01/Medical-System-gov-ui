import { describe, expect, it } from "vitest";
import { isValidVerificationToken } from "./action-helpers";

describe("isValidVerificationToken", () => {
  it("accepts a lowercase UUID", () => {
    expect(
      isValidVerificationToken("550e8400-e29b-41d4-a716-446655440000"),
    ).toBe(true);
  });

  it("accepts an uppercase UUID", () => {
    expect(
      isValidVerificationToken("550E8400-E29B-41D4-A716-446655440000"),
    ).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidVerificationToken("")).toBe(false);
  });

  it("rejects a token longer than 500 chars", () => {
    const long = `550e8400-e29b-41d4-a716-446655440000-${"a".repeat(500)}`;
    expect(isValidVerificationToken(long)).toBe(false);
  });

  it("rejects a non-UUID payload (e.g. scanned QR text)", () => {
    expect(isValidVerificationToken("not-a-uuid")).toBe(false);
    expect(isValidVerificationToken("12345")).toBe(false);
  });

  it("rejects a UUID with a wrong segment length", () => {
    expect(
      isValidVerificationToken("550e8400-e29b-41d4-a716-44665544000"),
    ).toBe(false);
  });
});
