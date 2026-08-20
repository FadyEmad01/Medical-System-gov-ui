import type { ApplicationStatus } from "../../../types";

/** Patient queue URL is the source of truth for filter state — shareable, back-button safe. */
export const PATIENT_QUEUE_STATUSES: readonly ApplicationStatus[] = [
  "Submitted",
  "UnderReview",
  "WaitingForDocuments",
  "Approved",
  "Rejected",
  "Cancelled",
  "Draft",
];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 200;

export interface PatientQueueFilters {
  /** Undefined = All statuses. */
  status: ApplicationStatus | undefined;
  page: number;
  /** Free-text search for patientName / nationalId — client-side. */
  search: string;
}

/** "all" or a status name → filter value; anything else falls back to All. */
export function parsePatientQueueFilters(
  params: URLSearchParams | { get(key: string): string | null },
): PatientQueueFilters {
  const rawStatus = params.get("status");
  const status = PATIENT_QUEUE_STATUSES.includes(rawStatus as ApplicationStatus)
    ? (rawStatus as ApplicationStatus)
    : undefined;

  const rawPage = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const search = params.get("search") ?? "";

  return { status, page, search };
}

export function patientQueueFiltersToParams(
  filters: PatientQueueFilters,
): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  // Page 1 is the default — keep URLs clean.
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.search.trim() !== "") params.set("search", filters.search.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Clamp to the API's bounds (1-based page, 1–200 page size). */
export function clampPage(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.trunc(value));
}

export function clampPageSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(value)));
}
