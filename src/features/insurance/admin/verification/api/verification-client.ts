import "server-only";

/** @deprecated Import from `@/features/insurance/verification` instead. */
export {
  checkEligibility,
  getCurrentVerification,
  getEligibility,
  getLatestVerification,
  getVerificationHistory,
  recordVerification,
  verifyCard,
} from "@/features/insurance/verification/api/verification-client";
