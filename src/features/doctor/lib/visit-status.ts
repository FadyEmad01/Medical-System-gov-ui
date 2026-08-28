/**
 * Visit status state machine (§9/§11): Scheduled → InProgress → Completed,
 * or Scheduled → Cancelled. No other transition ever, including re-applying
 * the same status. Derived UI rules follow the same contract.
 */

import type { VisitStatus } from "../types";
import { VISIT_TRANSITIONS } from "./constants";

export function nextStatuses(status: VisitStatus): readonly VisitStatus[] {
  return VISIT_TRANSITIONS[status];
}

export function canTransition(from: VisitStatus, to: VisitStatus): boolean {
  return nextStatuses(from).includes(to);
}

/** Completed / Cancelled — view only; no status change is ever valid again. */
export function isTerminalVisit(status: VisitStatus): boolean {
  return nextStatuses(status).length === 0;
}

/** PUT /visits/{id} clinical content + PATCH status: owner only, and never terminal. */
export function canEditVisit(status: VisitStatus): boolean {
  return !isTerminalVisit(status);
}

/** POST /visits/{id}/medications → 409 once the visit is Completed/Cancelled (§9). */
export function canAddMedication(status: VisitStatus): boolean {
  return canEditVisit(status);
}

/** Attachments upload is "own open visit only" (§10) — same gate as medications. */
export function canUploadAttachment(status: VisitStatus): boolean {
  return canEditVisit(status);
}
