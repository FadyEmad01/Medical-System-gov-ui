# Admin — Card Lifecycle: Implementation Plan (Phase 2)

Status: implemented. Verified against `admin-swagger.json`. Live E2E (phase 1)
already confirmed approve → auto-issue; this phase manages cards after they
exist.

## Scope correction vs the original admin plan

Card history (`GET /cards/{patientId}`) and detail (`GET /cards/detail/{cardId}`)
are **Admin-only** per the spec ("a citizen's own My Card screen should use
GET .../current instead"). So the earlier idea of a citizen card-history
section is dead: phase 2 is purely admin-side. Card PDF endpoint still does
not exist; the citizen QR placeholder stays.

## Contract

Actions (all Admin, per-card, on `/api/insurance/cards/{cardId}/…`):

| Action | Method | From → To | Body |
|---|---|---|---|
| suspend | PATCH | Active → Suspended | `{reason}` required, ≤1000 |
| reactivate | PATCH | Suspended → Active | none |
| revoke | PATCH | Active/Suspended → Revoked (terminal) | `{reason}` required, ≤1000 |
| renew | POST | Active only → fresh successor | `{reason}` optional |
| replace | POST | Active/Suspended → successor | `{replacementReason}` (Lost/Damaged/Stolen/Other) + `reasonNote` ≤1000 optional |
| rotate-token | PATCH | any, no status change, no new row | none |

Reads: `GET /cards/{patientId}` — full history incl. dependents' cards,
newest first; `GET /cards/detail/{cardId}` — bundle + `statusHistory[]`
(`CardStatusChangeResponseDto`: id, previousStatus, newStatus, reason,
changedBy, changedAt).

## UI

- Route `/dashboard/admin/cards/[patientId]`, reached from the review screen
  (applicant header link — "View cards"). No sidebar entry (needs a patient).
- History list: cardNumber, holder (patient or dependent), status badge,
  isLatestCard marker, issued/expires dates, reasonNote/replacementReason when
  present. Actions derived per card status (`deriveAllowedCardActions`):
  Active → suspend/revoke/renew/replace/rotate-token · Suspended →
  reactivate/revoke/replace · Revoked/Superseded → none (terminal summary).
- Reason dialog shared: plain reason (suspend/revoke/renew) or
  replacement-reason select + note (replace). Same validation boundaries as
  the review decisions (1–1000 required/optional, ≤1000 note).
- Confirm-only, no dialog: reactivate (AlertDialog), rotate-token (direct
  with confirm toast).
- Mutations invalidate `["admin","cards",patientId]` + detail keys.
- Same S1–S3 rules as phase 1 (role-gated hooks, cache purge, client render).
