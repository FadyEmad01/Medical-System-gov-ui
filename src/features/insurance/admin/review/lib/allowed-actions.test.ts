import { describe, expect, it } from "vitest";
import type { ApplicationStatus } from "../../../types";
import { deriveAllowedActions, isClaimable } from "./allowed-actions";

const ALL_STATUSES: ApplicationStatus[] = [
  "Draft",
  "Submitted",
  "UnderReview",
  "WaitingForDocuments",
  "Approved",
  "Rejected",
  "Cancelled",
];

describe("deriveAllowedActions", () => {
  it("offers all three reason actions under review", () => {
    expect(deriveAllowedActions("UnderReview")).toEqual([
      "approve",
      "reject",
      "request-documents",
    ]);
  });

  it("offers only back-to-review while waiting for documents", () => {
    expect(deriveAllowedActions("WaitingForDocuments")).toEqual([
      "back-to-review",
    ]);
  });

  it("offers nothing on Draft — not yet submitted", () => {
    expect(deriveAllowedActions("Draft")).toEqual([]);
  });

  it("offers nothing on Submitted — claiming happens via the review GET", () => {
    expect(deriveAllowedActions("Submitted")).toEqual([]);
  });

  it.each(
    ALL_STATUSES.filter((s) => s !== "Submitted"),
  )("is total over %s without crashing", (status) => {
    expect(Array.isArray(deriveAllowedActions(status))).toBe(true);
  });

  it("terminal statuses never allow any action", () => {
    for (const status of ["Approved", "Rejected", "Cancelled"] as const) {
      expect(deriveAllowedActions(status)).toEqual([]);
    }
  });
});

describe("isClaimable", () => {
  it("only Submitted applications can be claimed", () => {
    expect(isClaimable("Submitted")).toBe(true);
    for (const status of ALL_STATUSES.filter((s) => s !== "Submitted")) {
      expect(isClaimable(status)).toBe(false);
    }
  });
});
