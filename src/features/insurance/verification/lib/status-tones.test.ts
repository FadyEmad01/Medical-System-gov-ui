import { describe, expect, it } from "vitest";
import {
  coverageValidTone,
  eligibilityTone,
  verificationStatusTone,
} from "./status-tones";

describe("eligibilityTone", () => {
  it("maps known statuses", () => {
    expect(eligibilityTone("Eligible")).toContain("success");
    expect(eligibilityTone("PendingReview")).toContain("warning");
    expect(eligibilityTone("NotEligible")).toContain("destructive");
    expect(eligibilityTone("Suspended")).toContain("destructive");
    expect(eligibilityTone("Expired")).toContain("destructive");
  });

  it("falls back for unknown / missing", () => {
    expect(eligibilityTone(undefined)).toContain("muted");
    expect(eligibilityTone("Other")).toContain("muted");
  });
});

describe("verificationStatusTone", () => {
  it("maps Verified / Pending / else", () => {
    expect(verificationStatusTone("Verified")).toContain("success");
    expect(verificationStatusTone("Pending")).toContain("warning");
    expect(verificationStatusTone("NotVerified")).toContain("destructive");
  });
});

describe("coverageValidTone", () => {
  it("distinguishes valid vs not", () => {
    expect(coverageValidTone(true)).toContain("success");
    expect(coverageValidTone(false)).toContain("muted");
  });
});
