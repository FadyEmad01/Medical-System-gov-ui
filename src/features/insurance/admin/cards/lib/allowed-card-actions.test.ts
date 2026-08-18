import { describe, expect, it } from "vitest";
import { deriveAllowedCardActions } from "./allowed-card-actions";

describe("deriveAllowedCardActions", () => {
  it("Active offers everything except reactivate", () => {
    expect(deriveAllowedCardActions("Active")).toEqual([
      "suspend",
      "revoke",
      "renew",
      "replace",
      "rotate-token",
    ]);
  });

  it("Suspended offers the three recovery paths", () => {
    expect(deriveAllowedCardActions("Suspended")).toEqual([
      "reactivate",
      "revoke",
      "replace",
    ]);
  });

  it("Revoked is terminal", () => {
    expect(deriveAllowedCardActions("Revoked")).toEqual([]);
  });

  it("Superseded is terminal — act on the successor", () => {
    expect(deriveAllowedCardActions("Superseded")).toEqual([]);
  });
});
