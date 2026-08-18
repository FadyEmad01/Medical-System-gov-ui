# Admin — Category Configuration + Verification (Phases 3–4): Plan

Status: implemented. All rules read from `admin-swagger.json`.

## Phase 3 — Category configuration

Routes: `/dashboard/admin/categories` (list + create) and
`/dashboard/admin/categories/[categoryId]` (edit, 4 tabs: General / Eligibility
rule / Required documents / Preview).

Contract:

- `GET /categories/all` — every category incl. inactive (Admin; the citizen
  list endpoint stays the active-only source for patient UI)
- `POST /categories`, `PUT /categories/{id}` — `InsuranceCategoryRequestDto`:
  code* ≤50, name* ≤100, description ≤500 nullable, displayOrder, isActive
- `PUT /categories/{id}/eligibility-rule` — full replace:
  minimumAge/maximumAge (nullable ints), allowedMaritalStatuses (nullable
  array, empty = no restriction), guardianRequired, dependentsAllowed
- `GET /categories/{id}/requirements` — all rows incl. inactive
- `POST .../requirements` — add: documentType* (closed set of 8), displayName
  ≤200, helpText ≤500, sampleDocumentUrl ≤500, displayOrder, isMandatory
- `PUT .../requirements/{requirementId}` — update metadata incl. isActive
- `DELETE .../requirements/{requirementId}`
- Bulk `PUT .../requirements` deliberately unused (guide prefers granular)

Rules: category code likely immutable in practice (identity field) — the form
sends it but the UI marks it read-only on edit to avoid accidental identity
changes. Mutations invalidate the admin category cache AND the citizen
`["insurance","categories"]` cache (the wizard reads the same reference data).

## Phase 4 — Verification & eligibility

Route `/dashboard/admin/verification` (nav: "Verification", Admin group).
Three tools on one page, patient context via `?patientId=` (the review screen
links "Record checks" with the patient pre-filled):

- **Verify card** — `POST /cards/verify {verificationToken*}` → minimal
  `CardVerificationResultDto` (cardNumber, holderFullName, isCurrentlyValid,
  expiresAt, status). No PII beyond the name by design.
- **Record verification** — `POST /verification/verify`:
  patientId*, status* (Verified/NotVerified/Pending), context*
  (Appointment/CheckIn/ClinicVisit/EmergencyAdmission/Billing), reason*,
  remarks optional.
- **Eligibility check** — `POST /eligibility/check`: patientId*, status*
  (Eligible/NotEligible/PendingReview/Suspended/Expired), reason*, remarks
  optional.

Result feedback: card result renders as a status card; the two record-actions
toast + echo the recorded decision. Success also invalidates
`["admin","review",…]` bundles (they embed eligibility/verification
snapshots) and `["insurance"]` (citizen status reads the same records).

Same S1–S3 rules as phases 1–2 (role-gated, cache purge, client-rendered).
Doctor access (guide allows Doctor for verify actions) is out of scope until
a Doctor surface exists.
