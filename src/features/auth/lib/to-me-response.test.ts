import { describe, expect, it } from "vitest";
import { toMeResponse } from "./to-me-response";

describe("toMeResponse", () => {
  it("projects an AuthResponse onto the MeResponse identity shape", () => {
    const me = toMeResponse({
      token: "jwt",
      expiresAtUtc: "2026-08-11T12:00:00Z",
      userId: 42,
      nationalId: "29901011234567",
      username: "ahmed.hassan",
      fullName: "Ahmed Hassan Mohamed Ali",
      role: "Patient",
    });

    expect(me).toEqual({
      userId: 42,
      nationalId: "29901011234567",
      username: "ahmed.hassan",
      fullName: "Ahmed Hassan Mohamed Ali",
      role: "Patient",
    });
  });
});
