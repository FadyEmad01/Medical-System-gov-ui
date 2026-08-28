import { describe, expect, it } from "vitest";
import { parseNationalId } from "./parse-national-id";

describe("parseNationalId", () => {
  it("accepts exactly 14 digits", () => {
    expect(parseNationalId("29801011234567")).toBe("29801011234567");
  });

  it("trims surrounding whitespace", () => {
    expect(parseNationalId("  29801011234567  ")).toBe("29801011234567");
  });

  it("rejects wrong lengths", () => {
    expect(parseNationalId("2980101123456")).toBeNull();
    expect(parseNationalId("298010112345678")).toBeNull();
    expect(parseNationalId("")).toBeNull();
  });

  it("rejects non-digit input", () => {
    expect(parseNationalId("2980101a234567")).toBeNull();
    expect(parseNationalId("٢٩٨٠١٠١١٢٣٤٥٦٧")).toBeNull();
  });
});
