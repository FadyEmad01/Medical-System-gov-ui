import { describe, expect, it } from "vitest";
import { panelNeedsApplicationDetail } from "./panel-needs-detail";

describe("panelNeedsApplicationDetail", () => {
  it("is true for panels that read application detail", () => {
    expect(panelNeedsApplicationDetail("Submitted")).toBe(true);
    expect(panelNeedsApplicationDetail("UnderReview")).toBe(true);
    expect(panelNeedsApplicationDetail("WaitingForDocuments")).toBe(true);
    expect(panelNeedsApplicationDetail("Rejected")).toBe(true);
  });

  it("is false for panels that do not", () => {
    expect(panelNeedsApplicationDetail("Draft")).toBe(false);
    expect(panelNeedsApplicationDetail("Approved")).toBe(false);
    expect(panelNeedsApplicationDetail("Cancelled")).toBe(false);
    expect(panelNeedsApplicationDetail(null)).toBe(false);
    expect(panelNeedsApplicationDetail(undefined)).toBe(false);
  });
});
