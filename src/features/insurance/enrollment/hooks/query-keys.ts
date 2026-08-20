/** React Query keys for the enrollment feature. */

export const CATEGORIES_QUERY_KEY = ["insurance", "categories"] as const;

export const CURRENT_ENROLLMENT_QUERY_KEY = [
  "insurance",
  "enrollment",
  "current",
] as const;

export const READINESS_QUERY_KEY = [
  "insurance",
  "enrollment",
  "readiness",
] as const;

export const SUMMARY_QUERY_KEY = [
  "insurance",
  "enrollment",
  "summary",
] as const;

export const DOCUMENTS_QUERY_KEY = (patientId: number) =>
  ["insurance", "documents", patientId] as const;

export const DEPENDENTS_QUERY_KEY = (patientId: number) =>
  ["insurance", "dependents", patientId] as const;

export const APPLICATION_DETAIL_QUERY_KEY = (applicationId: string) =>
  ["insurance", "applications", applicationId] as const;

export const APPLICATIONS_QUERY_KEY = (patientId: number) =>
  ["insurance", "applications", "list", patientId] as const;

export const STATUS_QUERY_KEY = (patientId: number) =>
  ["insurance", "status", patientId] as const;
