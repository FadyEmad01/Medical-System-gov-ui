"use client";

import type { CardState, CardStateKind } from "../../lib/card-status";
import { CARD_STATUS_TONE } from "../../lib/card-status-tone";
import { errorMessageKey } from "../../lib/error-message-key";
import type { ProfileResponseDto } from "../../types";
import {
  AttentionState,
  EmptyState,
  ReadyState,
} from "./card-state-views";

export type PendingKind = Extract<
  CardStateKind,
  "not-started" | "in-progress" | "awaiting-issuance"
>;

export { CARD_STATUS_TONE, errorMessageKey };

export function CardStateContent({
  state,
  profile,
  beneficiaryType,
}: {
  state: CardState;
  profile: ProfileResponseDto | null;
  beneficiaryType?: string | null;
}) {
  if (state.kind === "ready") {
    return state.card ? (
      <ReadyState
        card={state.card}
        profile={profile}
        beneficiaryType={beneficiaryType}
      />
    ) : null;
  }
  if (state.kind === "attention") {
    return state.card ? <AttentionState card={state.card} /> : null;
  }
  return <EmptyState kind={state.kind} />;
}
