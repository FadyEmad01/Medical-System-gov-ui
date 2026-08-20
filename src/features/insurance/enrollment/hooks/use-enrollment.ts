/**
 * Enrollment hooks public surface — keep importing from this path for
 * backwards compatibility. Implementation lives in focused modules.
 */

export {
  APPLICATION_DETAIL_QUERY_KEY,
  APPLICATIONS_QUERY_KEY,
  CATEGORIES_QUERY_KEY,
  CURRENT_ENROLLMENT_QUERY_KEY,
  DEPENDENTS_QUERY_KEY,
  DOCUMENTS_QUERY_KEY,
  READINESS_QUERY_KEY,
  STATUS_QUERY_KEY,
  SUMMARY_QUERY_KEY,
} from "./query-keys";
export {
  useApplicationDetail,
  useApplications,
  useCategories,
  useCurrentEnrollment,
  useDependents,
  useDocuments,
  useReadiness,
  useStatus,
  useSummary,
} from "./use-enrollment-queries";
export {
  useAddDependent,
  useCancelApplication,
  useEndDependent,
  useSubmitEnrollment,
  useUploadDocument,
} from "./use-enrollment-mutations";
