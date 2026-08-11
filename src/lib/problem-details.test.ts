import { describe, expect, it } from "vitest";
import { parseProblemDetails } from "./problem-details";

describe("parseProblemDetails", () => {
  it("normalizes PascalCase field keys to camelCase", () => {
    const parsed = parseProblemDetails({
      title: "Validation failed",
      errors: {
        NationalId: ["National ID is invalid"],
        DateOfBirth: ["Date of birth is required"],
      },
    });

    expect(parsed.fieldErrors).toEqual({
      nationalId: "National ID is invalid",
      dateOfBirth: "Date of birth is required",
    });
  });

  it("joins multiple messages for one field with a space", () => {
    const parsed = parseProblemDetails({
      errors: {
        Password: ["Too short", "Must contain a number"],
      },
    });

    expect(parsed.fieldErrors.password).toBe("Too short Must contain a number");
  });

  it("prefers detail over title for the form error", () => {
    const parsed = parseProblemDetails({
      title: "Bad Request",
      detail: "Passwords do not match",
    });

    expect(parsed.formError).toBe("Passwords do not match");
  });

  it("falls back to title when detail is absent", () => {
    const parsed = parseProblemDetails({ title: "Conflict" });
    expect(parsed.formError).toBe("Conflict");
  });

  it("falls back to a translation key when neither detail nor title exists", () => {
    const parsed = parseProblemDetails({ status: 500 });
    expect(parsed.formError).toBe("errors.requestFailed");
  });

  it("skips empty message arrays", () => {
    const parsed = parseProblemDetails({ errors: { Email: [] } });
    expect(parsed.fieldErrors).toEqual({});
  });

  it("returns empty fieldErrors when no errors object present", () => {
    const parsed = parseProblemDetails({});
    expect(parsed.fieldErrors).toEqual({});
  });
});
