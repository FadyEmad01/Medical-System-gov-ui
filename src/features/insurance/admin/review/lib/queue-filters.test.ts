import { describe, expect, it } from "vitest";
import {
  clampPage,
  clampPageSize,
  parseQueueFilters,
  queueFiltersToParams,
} from "./queue-filters";

function paramsOf(record: Record<string, string>) {
  return new URLSearchParams(record);
}

describe("parseQueueFilters", () => {
  it("defaults to all statuses, page 1", () => {
    expect(parseQueueFilters(paramsOf({}))).toEqual({
      status: undefined,
      page: 1,
    });
  });

  it("accepts a known status", () => {
    expect(parseQueueFilters(paramsOf({ status: "Submitted" }))).toEqual({
      status: "Submitted",
      page: 1,
    });
  });

  it("rejects an unknown status (reads as all)", () => {
    expect(
      parseQueueFilters(paramsOf({ status: "AbsolutelyNotAStatus" })).status,
    ).toBeUndefined();
  });

  it("parses a valid page and clamps garbage", () => {
    expect(parseQueueFilters(paramsOf({ page: "3" })).page).toBe(3);
    expect(parseQueueFilters(paramsOf({ page: "0" })).page).toBe(1);
    expect(parseQueueFilters(paramsOf({ page: "-7" })).page).toBe(1);
    expect(parseQueueFilters(paramsOf({ page: "banana" })).page).toBe(1);
  });
});

describe("queueFiltersToParams", () => {
  it("omits everything at defaults for a clean URL", () => {
    expect(queueFiltersToParams({ status: undefined, page: 1 })).toBe("");
  });

  it("serializes status and non-first pages", () => {
    expect(queueFiltersToParams({ status: "UnderReview", page: 4 })).toBe(
      "?status=UnderReview&page=4",
    );
  });

  it("round-trips through parse", () => {
    const filters = { status: "Approved" as const, page: 2 };
    const parsed = parseQueueFilters(
      paramsOf(
        Object.fromEntries(
          new URLSearchParams(queueFiltersToParams(filters).slice(1)),
        ),
      ),
    );
    expect(parsed).toEqual(filters);
  });
});

describe("clamps", () => {
  it("clampPage floors at 1 and truncates", () => {
    expect(clampPage(0)).toBe(1);
    expect(clampPage(2.9)).toBe(2);
    expect(clampPage(Number.NaN)).toBe(1);
  });

  it("clampPageSize bounds to 1..200", () => {
    expect(clampPageSize(0)).toBe(1);
    expect(clampPageSize(999)).toBe(200);
    expect(clampPageSize(20)).toBe(20);
  });
});
