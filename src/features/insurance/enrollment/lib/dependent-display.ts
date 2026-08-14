/**
 * Masks a national ID for display, keeping only the last four digits so the
 * list stays scannable without exposing the full number. Short or malformed
 * values are masked entirely rather than leaked.
 */
export function maskNationalId(nationalId: string | null | undefined): string {
  if (!nationalId) return "";
  if (nationalId.length <= 4) return "•".repeat(nationalId.length);
  return `${"•".repeat(nationalId.length - 4)}${nationalId.slice(-4)}`;
}
