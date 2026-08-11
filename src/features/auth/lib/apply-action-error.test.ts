import type { UseFormReturn } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import type { AuthActionError } from "../actions";
import { applyActionError } from "./apply-action-error";

type FormData = { nationalId: string; password: string };

function createMockForm(): UseFormReturn<FormData> {
  const setError = vi.fn();
  return {
    setError,
    getValues: vi.fn().mockReturnValue({ nationalId: "", password: "" }),
  } as unknown as UseFormReturn<FormData>;
}

describe("applyActionError", () => {
  it("maps known field errors onto the form", () => {
    const form = createMockForm();
    const err: AuthActionError = {
      kind: "validation",
      formError: "errors.validationFailed",
      fieldErrors: { nationalId: "Invalid national ID" },
    };

    applyActionError(err, form);

    expect(form.setError).toHaveBeenCalledWith("nationalId", {
      type: "server",
      message: "Invalid national ID",
    });
    expect(form.setError).toHaveBeenCalledWith("root", {
      type: "server",
      message: "errors.validationFailed",
    });
  });

  it("skips field keys that do not exist on the form", () => {
    const form = createMockForm();
    const err: AuthActionError = {
      kind: "validation",
      formError: "errors.validationFailed",
      fieldErrors: { someUnknownField: "nope" },
    };

    applyActionError(err, form);

    expect(form.setError).not.toHaveBeenCalledWith("someUnknownField", {
      type: "server",
      message: "nope",
    });
    expect(form.setError).toHaveBeenCalledTimes(1); // root only
  });

  it("synthesizes a fallback root error when nothing was mapped", () => {
    const form = createMockForm();

    applyActionError({}, form);

    expect(form.setError).toHaveBeenCalledWith("root", {
      type: "server",
      message: "errors.requestFailed",
    });
  });

  it("does not double-render a root error when a field error was mapped and no formError exists", () => {
    const form = createMockForm();
    const err: AuthActionError = {
      kind: "conflict",
      formError: "",
      fieldErrors: { password: "Wrong password" },
    };

    applyActionError(err, form);

    expect(form.setError).toHaveBeenCalledTimes(1);
    expect(form.setError).toHaveBeenCalledWith("password", {
      type: "server",
      message: "Wrong password",
    });
  });
});
