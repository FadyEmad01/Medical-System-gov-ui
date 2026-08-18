/**
 * Backend DTOs for the ADMIN card-lifecycle feature (admin-swagger.json).
 * The card DTOs themselves live in the shared insurance domain types now that
 * the backend opened those reads to citizens — both surfaces share the same
 * contract; re-exported here so the feature's imports stay local.
 */

export type {
  CardDetailResponseDto,
  CardStatusChangeResponseDto,
} from "../../types";

export type ReplacementReason = "Lost" | "Damaged" | "Stolen" | "Other";
