import "server-only";

import { apiClient } from "@/lib/api-client";
import type { ApplicationDetailResponseDto } from "../../../enrollment/types";
import type { ApplicationStatus } from "../../../types";
import type {
  ApplicationQueueResult,
  ApplicationReviewDetailResponseDto,
} from "../types";

export interface QueueQuery {
  status?: ApplicationStatus;
  page?: number;
  pageSize?: number;
}

/**
 * GET /insurance/applications?Status=&Page=&PageSize= — the cross-patient
 * queue, server-paged. Rows are plain ApplicationResponseDto: no applicant
 * identity (that lives behind the review endpoint).
 */
export function getApplicationQueue(
  token: string,
  query: QueueQuery = {},
): Promise<ApplicationQueueResult> {
  const params = new URLSearchParams();
  if (query.status) params.set("Status", query.status);
  if (query.page != null) params.set("Page", String(query.page));
  if (query.pageSize != null) params.set("PageSize", String(query.pageSize));
  const qs = params.toString();
  return apiClient.get<ApplicationQueueResult>(
    `/insurance/applications${qs ? `?${qs}` : ""}`,
    { token },
  );
}

/**
 * GET /insurance/applications/{applicationId}/review — the decision bundle.
 *
 * SIDE EFFECT: auto-claims a freshly Submitted application (advances it to
 * UnderReview). Never call speculatively or from a prefetched route.
 */
export function getReviewDetail(
  token: string,
  applicationId: string,
): Promise<ApplicationReviewDetailResponseDto> {
  return apiClient.get<ApplicationReviewDetailResponseDto>(
    `/insurance/applications/${applicationId}/review`,
    { token },
  );
}

/**
 * GET /insurance/applications/by-number/{applicationNumber} — direct lookup
 * for the printed/spoken reference (e.g. APP-2026-00000015).
 */
export function getApplicationByNumber(
  token: string,
  applicationNumber: string,
): Promise<ApplicationDetailResponseDto> {
  return apiClient.get<ApplicationDetailResponseDto>(
    `/insurance/applications/by-number/${encodeURIComponent(applicationNumber)}`,
    { token },
  );
}
