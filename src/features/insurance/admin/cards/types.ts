/**
 * Backend DTOs for the ADMIN card-lifecycle feature (admin-swagger.json).
 * The card DTOs themselves live in the shared insurance domain types now that
 * the backend opened those reads to citizens — both surfaces share the same
 * contract; re-exported here so the feature's imports stay local.
 */

import type { ApplicationResponseDto } from "../../enrollment/types";
import type { CardStatus } from "../../types";

/**
 * Application queue row enriched with patient identity and card status.
 * Backend will add these fields to GET /insurance/applications; type them
 * optional so the frontend degrades gracefully until then.
 */
export interface EnrichedApplicationDto extends ApplicationResponseDto {
  /** Patient full name — absent until backend enrichment ships. */
  patientName?: string | null;
  /** Patient national ID — absent until backend enrichment ships. */
  nationalId?: string | null;
  /** Patient's current card status — absent until backend enrichment ships. */
  cardStatus?: CardStatus | null;
}

export type {
  CardDetailResponseDto,
  CardStatusChangeResponseDto,
} from "../../types";

export type ReplacementReason = "Lost" | "Damaged" | "Stolen" | "Other";
