import { describe, expect, it } from "vitest";
import { parsePatientId } from "./parse-patient-id";

describe("parsePatientId (doctor re-export)", () => {
  it("delegates to shared insurance helper", () => {
    expect(parsePatientId("7")).toBe(7);
    expect(parsePatientId("0")).toBeNull();
  });
});
