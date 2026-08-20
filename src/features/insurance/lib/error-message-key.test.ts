import { describe, expect, it } from "vitest";
import { errorMessageKey } from "./error-message-key";

describe("errorMessageKey", () => {
  it("maps AuthActionError kinds", () => {
    expect(
      errorMessageKey({
        kind: "unauthorized",
        formError: "",
        fieldErrors: {},
      }),
    ).toBe("errors.sessionExpired");
    expect(
      errorMessageKey({
        kind: "forbidden",
        formError: "",
        fieldErrors: {},
      }),
    ).toBe("errors.forbidden");
    expect(
      errorMessageKey({
        kind: "notFound",
        formError: "",
        fieldErrors: {},
      }),
    ).toBe("errors.notFound");
  });

  it("falls back for unknown errors", () => {
    expect(errorMessageKey(new Error("x"))).toBe("errors.generic");
    expect(errorMessageKey(null)).toBe("errors.generic");
  });
});
