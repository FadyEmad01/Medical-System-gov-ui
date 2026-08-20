import "server-only";

import { apiClient } from "@/lib/api-client";
import type {
  InsuranceEligibilityResponseDto,
  InsuranceVerificationResponseDto,
} from "../types";
import type {
  CardVerificationResultDto,
  CheckEligibilityInput,
  VerifyInsuranceInput,
} from "../types";

/** POST /insurance/cards/verify — the point-of-care token check. */
export function verifyCard(
  token: string,
  verificationToken: string,
): Promise<CardVerificationResultDto> {
  return apiClient.post<CardVerificationResultDto>(
    "/insurance/cards/verify",
    { verificationToken },
    { token },
  );
}

/** POST /insurance/verification/verify — record a verification decision. */
export function recordVerification(
  token: string,
  input: VerifyInsuranceInput,
): Promise<InsuranceVerificationResponseDto> {
  return apiClient.post<InsuranceVerificationResponseDto>(
    "/insurance/verification/verify",
    serializeRecord(input),
    { token },
  );
}

/** POST /insurance/eligibility/check — record an eligibility decision. */
export function checkEligibility(
  token: string,
  input: CheckEligibilityInput,
): Promise<InsuranceEligibilityResponseDto> {
  return apiClient.post<InsuranceEligibilityResponseDto>(
    "/insurance/eligibility/check",
    serializeRecord(input),
    { token },
  );
}

/** GET /insurance/eligibility/{patientId} — current eligibility snapshot. */
export function getEligibility(
  token: string,
  patientId: number,
): Promise<InsuranceEligibilityResponseDto> {
  return apiClient.get<InsuranceEligibilityResponseDto>(
    `/insurance/eligibility/${patientId}`,
    { token },
  );
}

/** GET /insurance/verification/current/{patientId} — valid-now verification. */
export function getCurrentVerification(
  token: string,
  patientId: number,
): Promise<InsuranceVerificationResponseDto> {
  return apiClient.get<InsuranceVerificationResponseDto>(
    `/insurance/verification/current/${patientId}`,
    { token },
  );
}

/** GET /insurance/verification/{patientId}/latest — most recent row. */
export function getLatestVerification(
  token: string,
  patientId: number,
): Promise<InsuranceVerificationResponseDto> {
  return apiClient.get<InsuranceVerificationResponseDto>(
    `/insurance/verification/${patientId}/latest`,
    { token },
  );
}

/** GET /insurance/verification/{patientId}/history — newest first. */
export function getVerificationHistory(
  token: string,
  patientId: number,
): Promise<InsuranceVerificationResponseDto[]> {
  return apiClient.get<InsuranceVerificationResponseDto[]>(
    `/insurance/verification/${patientId}/history`,
    { token },
  );
}

function serializeRecord(input: {
  patientId: number;
  status: string;
  reason: string;
  remarks: string;
  context?: string;
}) {
  return {
    patientId: input.patientId,
    status: input.status,
    ...(input.context ? { context: input.context } : {}),
    reason: input.reason,
    ...(input.remarks === "" ? {} : { remarks: input.remarks }),
  };
}
