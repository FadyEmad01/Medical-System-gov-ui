/** Cache keys — purged with ["admin"] on session expiry (S1). */
export const CARD_HISTORY_QUERY_KEY = (patientId: number) =>
  ["admin", "cards", patientId] as const;
export const CARD_DETAIL_QUERY_KEY = (cardId: string) =>
  ["admin", "cards", "detail", cardId] as const;

export const CURRENT_CARD_QUERY_KEY = (patientId: number) =>
  ["admin", "cards", "current", patientId] as const;
export const PATIENT_STATUS_QUERY_KEY = (patientId: number) =>
  ["admin", "status", patientId] as const;
export const PATIENT_APPLICATIONS_QUERY_KEY = (patientId: number) =>
  ["admin", "applications", "patient", patientId] as const;
export const PATIENT_APPLICATION_DETAIL_QUERY_KEY = (applicationId: string) =>
  ["admin", "applications", "detail", applicationId] as const;
