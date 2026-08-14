import "server-only";

import { apiClient } from "@/lib/api-client";
import type {
  ApplicationDetailResponseDto,
  ApplicationResponseDto,
} from "../enrollment/types";

/** GET /insurance/applications/detail/{applicationId} — application + review history. */
export function getApplicationDetail(
  token: string,
  applicationId: string,
): Promise<ApplicationDetailResponseDto> {
  return apiClient.get<ApplicationDetailResponseDto>(
    `/insurance/applications/detail/${applicationId}`,
    { token },
  );
}

/** PATCH /insurance/applications/{applicationId}/cancel — body-less. */
export function cancelApplication(
  token: string,
  applicationId: string,
): Promise<ApplicationResponseDto> {
  return apiClient.patch<ApplicationResponseDto>(
    `/insurance/applications/${applicationId}/cancel`,
    undefined,
    { token },
  );
}
