/** Pure helpers for admin review server actions (no `"use server"`). */

export function optionalTrimmed(value: string | null | undefined): string {
  return (value ?? "").trim();
}
