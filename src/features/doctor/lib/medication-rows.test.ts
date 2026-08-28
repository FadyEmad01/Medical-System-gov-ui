import { describe, expect, it } from "vitest";
import { parseMedicationRows } from "./medication-rows";

const full = {
  medicineName: "Panadol",
  dosage: "500mg",
  frequency: "3/day",
  duration: "5 days",
};

describe("parseMedicationRows", () => {
  it("drops entirely empty rows", () => {
    const result = parseMedicationRows([
      { medicineName: "", dosage: "", frequency: "", duration: "" },
      full,
    ]);
    expect(result).toEqual({ ok: true, rows: [full] });
  });

  it("returns no rows for an all-empty list", () => {
    const result = parseMedicationRows([
      { medicineName: "", dosage: "", frequency: "", duration: "" },
    ]);
    expect(result).toEqual({ ok: true, rows: [] });
  });

  it("rejects a partially filled row with its index", () => {
    const result = parseMedicationRows([
      { ...full },
      { medicineName: "Aspirin", dosage: "", frequency: "2/day", duration: "" },
    ]);
    expect(result).toEqual({ ok: false, issue: "incomplete", rowIndex: 1 });
  });

  it("rejects a row exceeding a field limit", () => {
    const result = parseMedicationRows([
      { ...full, medicineName: "x".repeat(201) },
    ]);
    expect(result).toEqual({ ok: false, issue: "tooLong", rowIndex: 0 });
  });

  it("trims values in accepted rows", () => {
    const result = parseMedicationRows([
      { ...full, medicineName: "  Panadol  " },
    ]);
    expect(result).toEqual({
      ok: true,
      rows: [{ ...full, medicineName: "Panadol" }],
    });
  });
});
