# Admin — Application Review Queue: Implementation Plan

Status: planned, security/performance-audited. Verified against
`admin-swagger.json` (OpenAPI 3.0.4) — every endpoint, body, and rule below is
read from the spec, not the guide.

## 1. Scope

The Admin case-review surface: a cross-patient application queue, a review
screen with the full decision bundle, and the four decision actions. Card
issuance is automatic on approve; the manual issue endpoint stays out of scope
(fallback only, §8).

Routes:

- `/[locale]/dashboard/admin/applications` — queue
- `/[locale]/dashboard/admin/applications/[applicationId]` — review screen

Both behind the existing `AdminGuard`. Role enforcement beyond the guard is
the backend's job (403 → `forbidden` mapping already exists in
`session-aware-error.ts`).

## 2. Contract (from admin-swagger.json)

### Queue

`GET /api/insurance/applications?Status=&Page=&PageSize=`

- `Status` optional `ApplicationStatus` filter — `"Submitted"` is the natural
  default for a needs-review queue
- `Page` 1-based (default 1), `PageSize` default 20, max 200
- Response `ApplicationResponseDtoPagedResultDto`:
  `{ items: ApplicationResponseDto[], totalCount, page, pageSize, totalPages }`
- **Queue rows carry no applicant name** — `ApplicationResponseDto` has no
  patient identity. The queue lists applicationNumber/status/dates/counts;
  identity is revealed on the review screen. Compensate with the existing
  `GET /applications/by-number/{applicationNumber}` for direct lookup.

### Review bundle

`GET /api/insurance/applications/{applicationId}/review` →
`ApplicationReviewDetailResponseDto`:

```
applicationNumber, id, patientId, status, submissionChannel, submittedAt,
reviewedBy, reviewedAt, decisionReason, eligibilityStatusSnapshot,
verificationStatusSnapshot, createdAt, correlationId,
applicant: ApplicantSummaryDto,        // full citizen profile incl. nationalId
insuranceCategory: InsuranceCategoryResponseDto,
documents: CitizenDocumentResponseDto[],
dependents: DependentResponseDto[],
eligibility: InsuranceEligibilityResponseDto | null,
verification: InsuranceVerificationResponseDto | null,
reviewHistory: ApplicationReviewResponseDto[]
```

**Auto-claim:** opening this endpoint on a `Submitted` application advances it
to `UnderReview`. Opening the review screen is a state transition — treat it
accordingly (§6, stale-detail rule).

### Decisions (all PATCH, all Admin-only, all require current status)

| Action | From status | Body | citizenVisibleReason | internalNotes |
|---|---|---|---|---|
| `.../approve` | UnderReview | `{citizenVisibleReason?, internalNotes?}` | optional, ≤1000 | optional, ≤2000 |
| `.../reject` | UnderReview | `{citizenVisibleReason, internalNotes?}` | **required**, 1–1000 | optional, ≤2000 |
| `.../request-documents` | UnderReview | `{citizenVisibleReason, internalNotes?}` | **required**, 1–1000 | optional, ≤2000 |
| `.../back-to-review` | WaitingForDocuments | none | — | — |

`approve` **auto-issues cards** (applicant + dependents, atomic). The
`POST /cards/issue/{applicationId}` endpoint is a manual fallback for the rare
failure case — out of scope for the first cut.

Error shapes already handled by the shared stack: RFC 7807 → `ApiError` kinds;
400 validation, 401 session, 403 forbidden, 404 notFound, 409 (wrong status —
e.g. another admin decided first).

## 3. Status model

```
Submitted --(open review: auto-claim)--> UnderReview
UnderReview --approve-->  Approved  (cards issued automatically)
UnderReview --reject-->   Rejected
UnderReview --request-documents--> WaitingForDocuments
WaitingForDocuments --back-to-review--> UnderReview
(citizen uploads do NOT move the status — back-to-review is explicit)
```

Pure derivation (mirrors `card-status.ts` pattern):

```ts
type ReviewAction = "approve" | "reject" | "request-documents" | "back-to-review";
function deriveAllowedActions(status: ApplicationStatus): ReviewAction[] {
  switch (status) {
    case "UnderReview":        return ["approve", "reject", "request-documents"];
    case "WaitingForDocuments": return ["back-to-review"];
    default: return [];      // Draft/Submitted/Approved/Rejected/Cancelled
  }
}
```

`Submitted` intentionally maps to no action: the screen shows an "open/claim"
affordance instead (GET review transitions it), then the action set appears.

## 4. Feature layout

**Architectural invariant (S2):** the review page stays client-rendered.
`GET .../review` auto-claims (a state mutation), so the bundle must never be
fetched during server render or route prefetch — Next.js `<Link>` prefetches
RSC payloads, and a server-fetched review page would auto-claim on hover.
Client `useQuery` only.

All admin hooks gate on the known role (S3): `enabled: role === "Admin"`
passed from `useMe` — a patient token reaching the route fires zero admin
actions instead of a round of 403s.

```
src/features/insurance/admin/
  review/
    api/
      applications-queue-client.ts   // GET queue (paged), GET review bundle
      review-actions-client.ts       // 4 PATCH decisions
    actions.ts                       // server actions, boundary validation
    hooks/
      use-application-queue.ts       // useQuery w/ [admin, applications, status, page]
      use-review-detail.ts           // useQuery [admin, review, id]
      use-review-actions.ts          // 4 mutations
    lib/
      allowed-actions.ts (+ .test.ts)
      queue-filters.ts               // status → URL search params
    components/
      queue/
        queue-page.tsx               // toolbar + table + pagination
        queue-table.tsx
        queue-pagination.tsx
        review-link.tsx              // row action
      review/
        review-page.tsx              // layout + sections + action bar
        applicant-section.tsx
        category-section.tsx         // requirements vs uploaded docs matrix
        documents-section.tsx        // reviewStatus badges + links
        dependents-section.tsx
        eligibility-section.tsx      // eligibility + verification snapshots
        history-section.tsx          // reviewHistory timeline (reuse tracking patterns)
        action-bar.tsx               // deriveAllowedActions-driven
        decision-dialog.tsx          // shared approve/reject/request form (reason rules)
```

App routes are thin re-exports, matching the citizen pages.

New shared UI primitives (repo lacks them): `ui/table.tsx` (shadcn),
`ui/textarea.tsx` (needed for reasons), queue-local pagination component.
`select`, `dialog`, `alert-dialog`, `badge`, `empty`, `skeleton` already exist.

## 5. Server actions

Same discipline as citizen actions — session token from cookie, boundary
validation, `toSessionAwareError`, no `Error` instances across the RSC boundary.

- `getApplicationQueueAction(status?, page?, pageSize?)`
  — page/pageSize clamped (1–∞ / 1–200), status validated against the enum
- `getReviewDetailAction(applicationId)` — trims id; **note: has side effects**
  (auto-claim), so the hook must NOT aggressively refetch (§6)
- `approveApplicationAction(applicationId, {citizenVisibleReason?, internalNotes?})`
- `rejectApplicationAction(applicationId, {citizenVisibleReason, internalNotes?})`
- `requestDocumentsAction(applicationId, {citizenVisibleReason, internalNotes?})`
- `backToReviewAction(applicationId)`
  — reject/request validate citizenVisibleReason 1–1000 chars (trim first);
  both fields validated ≤1000 / ≤2000; empty optionals sent as `undefined`,
  not `""`

## 6. Data flow and caching

- **Session expiry must purge admin caches (S1).** `handleSessionExpiry`
  currently removes only `ME_QUERY_KEY` + `["insurance"]`; the review bundle
  holds nationalId/address/mobile. Extend it to also
  `removeQueries({ queryKey: ["admin"] })` — no cached PII survives a session
  switch on a shared machine. Also set a modest `gcTime` (e.g. 5 min) on
  admin queries so bundles age out of memory even without expiry.
- Queue: `useQuery(["admin","applications", status ?? "all", page])`,
  `placeholderData` (keepPreviousData pattern) for page transitions (no table
  flash), `refetchOnWindowFocus: true` (P2) — cheap, paged, side-effect-free;
  keeps multi-admin queues honest between manual refreshes.
- Review detail: `useQuery(["admin","review", id])`, `staleTime: Infinity`
  within session — **opening auto-claims**, so refetching on focus would be a
  no-op state read but also refreshes documents the citizen may have just
  uploaded; refresh is explicit (button) or post-action. Deliberately NOT
  refetchOnWindowFocus.
- Every successful decision mutation:
  1. invalidate `["admin","applications"]` (queue)
  2. invalidate `["admin","review", id]`
  3. invalidate `["insurance"]` (citizen-side status of the same application)
- 409 on a decision (another admin got there first): toast the conflict
  message + refetch the detail — the action bar re-derives from fresh status.
- No idempotency keys anywhere: submit buttons disabled while mutation is
  in-flight; one click = one decision.

## 7. UI specification

### Queue page

- Toolbar: status `Select` (`Submitted` default; all 7 statuses + All),
  by-number search input → navigates to the review route via the by-number
  lookup, refresh button (spinner state). Search fires on submit only — no
  per-keystroke lookups (P3); if typeahead is ever wanted, debounce ≥400ms
- Table columns: applicationNumber (mono/tabular-nums) · status badge (reuse
  `APPLICATION_STATUS_TONE` vocabulary) · submittedAt (locale date) · channel
  · documents/dependents counts (tabular-nums) · open action
- Row click + explicit button → review route; number cell is the link
- Pagination: page size 20, prev/next + "page X of Y (N total)", disabled
  bounds; RTL-safe
- Empty per status (e.g. "no Submitted applications" reads as good news);
  skeleton rows on first load (no spinners)

### Review page

- Header: applicationNumber + status badge + applicant full name +
  submittedAt; the auto-claim note when status just moved Submitted →
  UnderReview
- Applicant section: the identity fields an admin verifies (name, nationalId,
  DOB/age, contact, address, occupation/marital — `ApplicantSummaryDto`)
- Category section: name + eligibility rule facts + **requirements matrix**:
  each active `documentRequirement` row crossed with the uploaded document of
  that type (current one, `isCurrent`), reviewStatus badge, uploaded date,
  link to `fileUrl` (`target="_blank" rel="noopener noreferrer"`). Missing
  types visibly empty — this is the decision's evidence at a glance
- Documents section renders `isCurrent` rows only; superseded uploads
  (re-uploads don't hide history) go in a collapsed "previous versions"
  disclosure (P1) — a messy case must not bury the evidence in stale rows
- Dependents section: list w/ relationship, age, nationalId
- Eligibility + verification snapshots: latest `eligibility`/`verification`
  records (status chips, reason, checked/verifiedAt); absent → "not checked"
- History: reuse the tracking-page connected-timeline pattern on
  `reviewHistory` (previousStatus → newStatus, outcome, reason, reviewer,
  date)
- Action bar (bottom, sticky on mobile):
  - `UnderReview`: Approve (primary, destructive-adjacent confirm via
    AlertDialog), Reject (destructive), Request documents (outline)
  - `WaitingForDocuments`: Back to review (primary) — copy explains the
    citizen already uploaded
  - Draft/Submitted: "Open for review" (triggers the GET that claims)
  - Terminal: no actions; decision summary + reason shown
- Decision dialog (shared for the 3 reason actions): citizenVisibleReason
  textarea (char count 0/1000, required for reject/request, optional for
  approve), internalNotes textarea (0/2000), submit disabled while invalid or
  in-flight, inline error mapping from fieldErrors
- Approved result state: success alert naming the auto-issued cards (response
  is the application; card data comes from the citizen card queries — show
  "cards issued" confirmation, link to the patient's tracking view)

## 8. Edge cases and rules

- **No applicant name in queue rows** (contract limit) — by-number lookup is
  the search path; queue filters do the narrowing
- **Stale detail**: two admins, one application — 409 handler refetches and
  re-derives; never keep the action bar enabled off stale status
- **Auto-claim is visible**: queue refetch after navigating back so a claimed
  row leaves the Submitted filter
- **Terminal reasons**: `decisionReason` displayed on approved/rejected detail
- Manual `POST /cards/issue/{applicationId}` fallback: NOT in the UI v1; note
  for ops if auto-issue ever fails (409 message will say why)
- Citizen side already renders `WaitingForDocuments` (waiting-documents panel
  exists) — no citizen changes needed in this phase

## 8a. Security & performance audit (folded in)

Findings from the pre-implementation audit; IDs referenced above.

**Security**

- **S1 (high) — admin PII cache purge.** `handleSessionExpiry` must remove
  `["admin"]` queries too, or the review bundle (nationalId, address, mobile)
  survives a dead session in browser memory on shared machines. §6.
- **S2 (medium) — auto-claim vs prefetch.** `GET .../review` mutates state;
  the review page must stay client-rendered so `<Link>` RSC prefetch can
  never trigger the claim. Architectural invariant, §4.
- **S3 (medium) — role-gated queries.** Middleware checks cookie presence
  only; admin hooks gate on `enabled: role === "Admin"` so a patient token
  fires zero admin actions instead of a 403 round. Backend remains the
  enforcement authority — this is UX + noise reduction, not the security
  boundary.
- Verified clean: token never crosses to the client (server actions read the
  cookie); server actions are POST + origin-checked by Next.js (no CSRF path
  to the auto-claim); boundary validation on every input; UUID
  non-enumerability + admin-or-owner scoping on by-number; React text
  rendering kills XSS from reason fields; double-approve races end in benign
  409.

**Performance**

- **P1 — bundle payload.** Current documents only in the matrix; superseded
  uploads collapsed. §7.
- **P2 — queue freshness.** `refetchOnWindowFocus` on the queue (never the
  detail). §6.
- **P3 — by-number search.** Submit-only, no per-keystroke lookups. §7.
- Verified fine: single-bundle review call (no N+1), server-side pagination
  with `totalCount`, `placeholderData` page transitions, route-level code
  splitting, trivial matrix computation, `staleTime: Infinity` prevents
  repeat claim GETs.

## 9. i18n (ar/en, `features/admin/translations` or common — TBD with nav)

Keys (~60): `admin.queue.*` (title, filters, columns, pagination, empty
states), `admin.review.*` (sections, matrix headers, "not checked"),
`admin.actions.*` (labels, confirms, dialog fields, char counts, toasts,
conflict/409 message), `admin.status.*` reuse of citizen status vocabulary.

## 10. Tests (vitest, matching existing lib-test culture)

- `allowed-actions.test.ts` — full status matrix
- `queue-filters.test.ts` — param clamping + enum guard
- decision validation unit tests — reason length boundaries (0/1/1000/1001,
  2000/2001), trim-to-empty behavior
- E2E smoke (manual, needs admin staging account): claim → request-documents
  → back-to-review → approve; verify citizen tracking reflects each state

## 11. Build order

1. UI primitives: `ui/table.tsx`, `ui/textarea.tsx`
2. `handleSessionExpiry` extension: purge `["admin"]` (S1)
3. DTOs + clients + actions (+ validation tests)
4. `allowed-actions` + role-gated hooks (S3)
5. Queue page (filter, table, pagination, empty/skeleton, focus refetch)
6. Review page sections (applicant/category matrix/documents w/ collapsed
   history/dependents/snapshots/history) — client-rendered only (S2)
7. Action bar + decision dialogs + invalidation wiring
8. Nav entry under admin (role-gated), translations, build + vitest green
9. Live smoke with admin credentials (blocker: none issued yet)
