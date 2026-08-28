/**
 * Doctor clinical query keys — every key is rooted at ["doctor"] so
 * purgeSessionCaches drops PII caches together on session expiry.
 */

export const DOCTOR_ROSTER_KEY = (doctorId: number) =>
  ["doctor", "roster", doctorId] as const;

export const DOCTOR_MEDICAL_SUMMARY_KEY = (patientId: number) =>
  ["doctor", "medicalSummary", patientId] as const;

export const DOCTOR_VISIT_HISTORY_KEY = (patientId: number) =>
  ["doctor", "visitHistory", patientId] as const;

export const DOCTOR_VISIT_KEY = (visitId: string) =>
  ["doctor", "visit", visitId] as const;

export const DOCTOR_ATTACHMENTS_KEY = (visitId: string) =>
  ["doctor", "attachments", visitId] as const;
