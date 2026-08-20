/** Public surface for shared insurance verification (Admin + Doctor). */

export {
  checkEligibilityAction,
  getCurrentVerificationAction,
  getEligibilityAction,
  getLatestVerificationAction,
  getVerificationHistoryAction,
  recordVerificationAction,
  verifyCardAction,
} from "./actions";
export {
  ELIGIBILITY_STATUSES,
  VERIFICATION_CONTEXTS,
  VERIFICATION_STATUSES,
} from "./lib/constants";
export type {
  EligibilityStatus,
  VerificationStatus,
} from "./lib/constants";
export {
  coverageValidTone,
  eligibilityTone,
  verificationStatusTone,
} from "./lib/status-tones";
export type {
  CardVerificationResultDto,
  CheckEligibilityInput,
  InsuranceEligibilityResponseDto,
  InsuranceVerificationResponseDto,
  VerificationContext,
  VerificationSource,
  VerifyInsuranceInput,
} from "./types";
