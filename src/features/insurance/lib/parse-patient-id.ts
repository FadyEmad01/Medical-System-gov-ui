/** Parse a patient ID from form / URL input. Null when empty or invalid. */
export function parsePatientId(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "" || !/^\d+$/.test(trimmed)) return null;
  const id = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(id) || id < 1) return null;
  return id;
}
