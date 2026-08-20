/**
 * Enrollment mutations barrel — preserves `./use-enrollment-mutations` imports.
 * Implementations live in focused domain modules.
 */

export {
  useCancelApplication,
  useSubmitEnrollment,
} from "./use-application-mutations";
export {
  useAddDependent,
  useEndDependent,
} from "./use-dependent-mutations";
export { useUploadDocument } from "./use-document-mutations";
