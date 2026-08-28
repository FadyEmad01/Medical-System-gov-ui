/**
 * Patient search is exact-match on the 14-digit Egyptian National ID —
 * no partial match or typeahead exists in the backend (§7.12, §8 Search Bar).
 */
const NATIONAL_ID_PATTERN = /^\d{14}$/;

export function parseNationalId(raw: string): string | null {
  const trimmed = raw.trim();
  return NATIONAL_ID_PATTERN.test(trimmed) ? trimmed : null;
}
