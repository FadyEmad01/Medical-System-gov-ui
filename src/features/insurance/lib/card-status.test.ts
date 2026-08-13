import { describe, expect, it } from "vitest";
import type { CardResponseDto, InsuranceStatusResponseDto } from "../types";
import { deriveCardState } from "./card-status";

function makeCard(overrides: Partial<CardResponseDto> = {}): CardResponseDto {
  return {
    id: "card-1",
    patientId: 1,
    status: "Active",
    isCurrentlyValid: true,
    issueReason: "Initial",
    version: 1,
    tokenVersion: 1,
    isLatestCard: true,
    issuedAt: "2026-08-01T00:00:00Z",
    expiresAt: "2027-08-01T00:00:00Z",
    applicationId: "app-1",
    createdAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

function makeStatus(
  overrides: Partial<InsuranceStatusResponseDto> = {},
): InsuranceStatusResponseDto {
  return { patientId: 1, documentCount: 0, ...overrides };
}

describe("deriveCardState", () => {
  it("returns not-started / step 1 for null status and no cards", () => {
    expect(deriveCardState(null, [])).toEqual({
      kind: "not-started",
      step: 1,
      card: null,
    });
  });

  it("returns not-started / step 1 when the status has no documents", () => {
    expect(deriveCardState(makeStatus(), [])).toEqual({
      kind: "not-started",
      step: 1,
      card: null,
    });
  });

  it("returns in-progress / step 2 when documents were uploaded", () => {
    const result = deriveCardState(makeStatus({ documentCount: 2 }), []);

    expect(result).toEqual({
      kind: "in-progress",
      step: 2,
      card: null,
    });
  });

  it("returns awaiting-issuance / step 2 when the application is approved", () => {
    const result = deriveCardState(
      makeStatus({ currentApplicationStatus: "Approved" }),
      [],
    );

    expect(result).toEqual({
      kind: "awaiting-issuance",
      step: 2,
      card: null,
    });
  });

  it("returns ready / step 3 with the latest card when it is active and valid", () => {
    const card = makeCard();
    const result = deriveCardState(
      makeStatus({ currentApplicationStatus: "Approved" }),
      [card],
    );

    expect(result).toEqual({ kind: "ready", step: 3, card });
  });

  it("prefers a valid active card over an approved application", () => {
    const card = makeCard();
    const result = deriveCardState(
      makeStatus({ currentApplicationStatus: "Approved", documentCount: 3 }),
      [card],
    );

    expect(result.kind).toBe("ready");
    expect(result.step).toBe(3);
    expect(result.card).toBe(card);
  });

  it("returns attention / step 2 for a suspended card, even when approved", () => {
    const card = makeCard({ status: "Suspended", isCurrentlyValid: false });
    const result = deriveCardState(
      makeStatus({ currentApplicationStatus: "Approved" }),
      [card],
    );

    expect(result).toEqual({ kind: "attention", step: 2, card });
  });

  it("returns attention / step 2 for a revoked card", () => {
    const card = makeCard({ status: "Revoked", isCurrentlyValid: false });
    const result = deriveCardState(null, [card]);

    expect(result).toEqual({ kind: "attention", step: 2, card });
  });

  it("returns attention / step 2 for a superseded card", () => {
    const card = makeCard({ status: "Superseded", isCurrentlyValid: false });
    const result = deriveCardState(null, [card]);

    expect(result).toEqual({ kind: "attention", step: 2, card });
  });

  it("falls through to not-started when the only card is active but invalid", () => {
    const card = makeCard({ isCurrentlyValid: false });
    const result = deriveCardState(null, [card]);

    expect(result).toEqual({ kind: "not-started", step: 1, card: null });
  });

  it("treats an empty cardNumber as a real card", () => {
    const card = makeCard({ cardNumber: "" });
    const result = deriveCardState(null, [card]);

    expect(result).toEqual({ kind: "ready", step: 3, card });
  });

  it("uses the first card (newest) even when an older card is valid", () => {
    const latest = makeCard({
      id: "card-latest",
      status: "Suspended",
      isCurrentlyValid: false,
    });
    const older = makeCard({
      id: "card-older",
      status: "Active",
      isCurrentlyValid: true,
    });
    const result = deriveCardState(null, [latest, older]);

    expect(result).toEqual({ kind: "attention", step: 2, card: latest });
  });
});
