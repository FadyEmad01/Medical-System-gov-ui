import { describe, expect, it } from "vitest";
import {
  CITIZEN_REASON_MAX,
  INTERNAL_NOTES_MAX,
  validateDecision,
} from "./decision-validation";

const valid = (over: Partial<Parameters<typeof validateDecision>[0]> = {}) => ({
  citizenVisibleReason: "ok",
  internalNotes: "",
  ...over,
});

describe("validateDecision", () => {
  it("accepts a normal reject payload", () => {
    expect(
      validateDecision(valid({ citizenVisibleReason: "Docs expired" }), {
        requireReason: true,
      }),
    ).toMatchObject({ ok: true });
  });

  it("requires a reason for reject / request-documents", () => {
    const result = validateDecision(
      { citizenVisibleReason: "", internalNotes: "" },
      { requireReason: true },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("validation");
      expect(result.error.fieldErrors.citizenVisibleReason).toBeDefined();
    }
  });

  it("allows a silent approve (optional reason)", () => {
    expect(
      validateDecision(
        { citizenVisibleReason: "", internalNotes: "" },
        {
          requireReason: false,
        },
      ),
    ).toMatchObject({ ok: true });
  });

  it("rejects a citizen reason over 1000 chars", () => {
    const result = validateDecision(
      valid({ citizenVisibleReason: "x".repeat(CITIZEN_REASON_MAX + 1) }),
      { requireReason: false },
    );
    expect(result.ok).toBe(false);
  });

  it("accepts exactly 1000 chars (boundary)", () => {
    expect(
      validateDecision(
        valid({ citizenVisibleReason: "x".repeat(CITIZEN_REASON_MAX) }),
        {
          requireReason: true,
        },
      ),
    ).toMatchObject({ ok: true });
  });

  it("rejects internal notes over 2000 chars", () => {
    const result = validateDecision(
      valid({ internalNotes: "y".repeat(INTERNAL_NOTES_MAX + 1) }),
      { requireReason: false },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.fieldErrors.internalNotes).toBeDefined();
    }
  });

  it("accepts exactly 2000 internal chars (boundary)", () => {
    expect(
      validateDecision(
        valid({ internalNotes: "y".repeat(INTERNAL_NOTES_MAX) }),
        { requireReason: true },
      ),
    ).toMatchObject({ ok: true });
  });
});
