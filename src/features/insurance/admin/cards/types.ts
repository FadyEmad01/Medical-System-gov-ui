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
 * patientFullName and patientNationalId ARE shipped by the Admin API
 * (verified live swagger 2026-08-23); nullable when the patient record is
 * gone. cardStatus is NOT yet shipped by the backend — typed optional so the
 * UI renders "—" until it lands.
 */
export interface EnrichedApplicationDto extends ApplicationResponseDto {
  /** Patient full name — Admin API enrichment; null when the patient record is gone. */
  patientFullName?: string | null;
  /** Patient national ID — Admin API enrichment; null when the patient record is gone. */
  patientNationalId?: string | null;
  /** Patient's current card status — not yet shipped by the backend. */
  cardStatus?: CardStatus | null;
}

export type {
  CardDetailResponseDto,
  CardStatusChangeResponseDto,
} from "../../types";

export type ReplacementReason = "Lost" | "Damaged" | "Stolen" | "Other";
