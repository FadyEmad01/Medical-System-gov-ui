import type { AuthActionError } from "@/features/auth/lib/action-error";

export function invalid(formError: string): {
  ok: false;
  error: AuthActionError;
} {
  return {
    ok: false,
    error: { kind: "validation", formError, fieldErrors: {} },
  };
}

export function idOf(value: string): string {
  return value.trim();
}
