# Domain 1 — Insurance Card Enrollment: Frontend Implementation Flow

> **Audience:** Frontend Engineers only. This is not a backend design document.
>
> **Source of truth:** the current backend implementation (`Controllers/`, `Services/`, `DTOs/`, `Data/InsuranceCategorySeeder.cs`) as of 2026-08-13. Every API, field, and rule below is taken directly from that code. Nothing here is invented.
>
> **How to read the markers used throughout this document:**
> - `NOT IMPLEMENTED` — the capability does not exist in the backend at all. Do not build UI that depends on it.
> - `MVP BUSINESS ASSUMPTION — NOT AN OFFICIAL GOVERNMENT REGULATION` — this is real, currently-configured data (seeded age ranges, marital-status rules, document lists), but it is a platform decision made for this MVP, not a legal/government requirement. It is fully Admin-editable at runtime and can change without a code deploy — do not hardcode it as permanent business logic anywhere in the frontend.

---

## Table of Contents

1. [Overall Citizen Flow](#1-overall-citizen-flow)
2. [Insurance Category Selection Screen](#2-insurance-category-selection-screen)
3. [Category-Specific Flows](#3-category-specific-flows)
4. [Category Comparison Matrix](#4-category-comparison-matrix)
5. [API Flow Matrix](#5-api-flow-matrix)
6. [Frontend State Machine](#6-frontend-state-machine)
7. [UI States](#7-ui-states)
8. [Important Frontend Rules](#8-important-frontend-rules)
9. [MVP Assumptions vs Backend Facts](#9-mvp-assumptions-vs-backend-facts)
10. [Backend Gaps Affecting Frontend](#10-backend-gaps-affecting-frontend)
11. [Final Page-by-Page Blueprint](#11-final-page-by-page-blueprint)

---

## 1. Overall Citizen Flow

```
Login
   ↓  POST /api/auth/login
Profile Completion
   ↓  GET /api/profile → PUT /api/profile
Insurance Categories
   ↓  GET /api/insurance/categories
Select Insurance Category
   ↓  POST /api/insurance/enrollment/start
Eligibility Check
   ↓  GET /api/insurance/enrollment/readiness  (isEligibleForCategory / eligibilityViolations)
Required Documents
   ↓  (derived from the category object already returned in Step "Select")
Upload Documents
   ↓  POST /api/insurance/documents/upload
Dependents (if applicable)
   ↓  POST/GET /api/insurance/dependents
Readiness Check
   ↓  GET /api/insurance/enrollment/readiness
Review Application
   ↓  GET /api/insurance/enrollment/summary
Submit Application
   ↓  PATCH /api/insurance/enrollment/submit
Application Status
   ↓  GET /api/insurance/status/{patientId}  or  GET /api/insurance/applications/detail/{applicationId}
Admin Review
   ↓  (Admin-only: PATCH /api/insurance/applications/{applicationId}/review)
Approved
   ↓  (application Status becomes "Approved" — visible via the status/detail APIs above)
Admin Issues Insurance Card
   ↓  (Admin-only: POST /api/insurance/cards/issue/{applicationId})
Citizen Views Insurance Card
   ↓  GET /api/insurance/cards/current/{patientId}
```

Every arrow above is a real, existing endpoint — there is no step in this diagram the frontend needs to fake or work around.

---

## 2. Insurance Category Selection Screen

**API:** `GET /api/insurance/categories`

- Any authenticated user may call this (not role-restricted at the API level), but it should only be reached from the Patient-facing enrollment flow.
- **Which categories are visible:** only `IsActive == true` categories are returned by this endpoint — an inactive category never appears here (the Admin-only `GET /api/insurance/categories/all` is the one that includes inactive ones, and that endpoint is Admin-only; do not call it from a citizen screen).
- **Sort order:** the response is already ordered by `DisplayOrder` ascending — render in the order received, don't re-sort client-side.

### Fields to display per category card

| Field (from `InsuranceCategoryResponseDto`) | Use |
|---|---|
| `Name` | Card title |
| `Description` | Card subtitle/body (may be `null` — hide the line if so) |
| `MinimumAge` / `MaximumAge` | "Ages 18–26" style badge; `null` on either side means no bound on that side (e.g. `MinimumAge: 60, MaximumAge: null` → "Age 60+") |
| `AllowedMaritalStatuses` | Only show a marital-status badge if this array is non-empty (empty = no restriction, don't render "Any") |
| `GuardianRequired` | If `true`, show an informational note ("Guardian details will be requested during review") — **do not** treat this as a form field or a blocker on this screen |
| `DependentsAllowed` | If `false`, show a note ("This category does not cover dependents") |
| `RequiredDocumentTypes` | Use `.length` for a "N documents required" chip; use the actual list to seed the Documents step later — see [§3](#3-category-specific-flows) |
| `Id` | Not shown — used as the value passed to `POST /api/insurance/enrollment/start` |

**How required documents are determined for this screen:** `RequiredDocumentTypes` on this same response is already pre-filtered to active **and** mandatory requirements — this is the correct field for a citizen-facing count/preview. Do not use `DocumentRequirements` (the richer, unfiltered list) on a citizen screen; that one is for Admin tooling.

### Example UI representation

```
┌───────────────────────────────┐  ┌───────────────────────────────┐
│ Student                       │  │ Government Employee           │
│ Ages 18–26                    │  │ Age 18+                       │
│ 1 document required           │  │ 2 documents required           │
│                    [ Select ] │  │                     [ Select ]│
└───────────────────────────────┘  └───────────────────────────────┘
```

Selecting a card calls `POST /api/insurance/enrollment/start` with that category's `Id` — see [§3](#3-category-specific-flows), Step 2.

---

## 3. Category-Specific Flows

The **mechanics** of enrollment (which screens exist, which APIs they call, in what order) are **identical for every category** — only the actual eligibility numbers, required document list, and dependents/guardian behavior differ per category. To avoid repeating 200 identical lines nine times, this section is organized as:

- **§3.0 — Common Enrollment Mechanics:** the full, detailed Steps 1–12 flow, written once. This is what every category actually runs.
- **§3.1 — Student (fully worked example):** the complete flow with every step spelled out end-to-end, exactly as it would appear for a real build ticket.
- **§3.2–§3.9 — the remaining 8 categories:** only what's different from the common mechanics (Business Assumption box, the eligibility numbers, the document list, and dependents/guardian behavior). For every other step, follow §3.0 / §3.1 exactly — same APIs, same request/response shapes, same UI states.

### §3.0 — Common Enrollment Mechanics (applies to every category)

#### Step 1 — Select Category
**API:** `GET /api/insurance/categories` (see [§2](#2-insurance-category-selection-screen)). The frontend reads `RequiredDocumentTypes`, `MinimumAge`/`MaximumAge`, `AllowedMaritalStatuses`, `GuardianRequired`, `DependentsAllowed` straight off the selected category object and keeps it in local/wizard state — no need to re-fetch it on every subsequent step.

#### Step 2 — Start Enrollment
**API:** `POST /api/insurance/enrollment/start`

Request body:
```json
{ "insuranceCategoryId": "ab358e29-e9b3-4677-a762-e556d9fe0301" }
```

- **When to call it:** immediately after the citizen taps "Select" on a category card.
- **If the category is inactive:** `400 Bad Request` — should not normally happen since the list screen only ever shows active categories, but handle it (e.g. a stale cached list) by showing "This category is no longer available" and returning to the list.
- **If the citizen already has an active (non-terminal) application:** `409 Conflict`. **Before showing the category list at all**, call `GET /api/insurance/enrollment/current` — a `200` response means an enrollment already exists; route the citizen straight into it (resume, at whichever step readiness indicates is incomplete) instead of letting them pick a new category. A `404` from that call means it's safe to show the category list.
- **Success:** `200 OK`, `EnrollmentResponseDto` — store `ApplicationId`/`ApplicationNumber` for use by every following step.

#### Step 4 — Profile
**APIs:** `GET /api/profile`, `PUT /api/profile`

- **Which fields are required by the Profile API itself:** none. Every field on the update request is optional at the DTO level.
- **Which fields are "required" for enrollment readiness** (a completely separate, backend-computed rule — see Step 8): `Occupation`, `MaritalStatus`, `Nationality`, `EmergencyContactName`, `EmergencyContactPhone`. **`PreferredLanguage` is editable but is not part of this readiness check** — don't mark it with a required asterisk.
- **Editable fields:** `Occupation`, `MaritalStatus`, `Nationality`, `PreferredLanguage`, `EmergencyContactName`, `EmergencyContactPhone`.
- **Read-only fields** (shown for context, never editable here): `PatientId`, `NationalId`, `Username`, `FullName`, `DateOfBirth`, `Gender`, `MobileNumber`, `Governorate`, `District`, `Email`, `Address`.
- **`PUT` is a full replace:** send every editable field's current value on every save, even the ones the user didn't touch — an omitted/null field **clears** it server-side.
- **If the user leaves required-for-readiness data missing:** nothing breaks immediately — the Profile save still succeeds. It only shows up later as `profileComplete: false` in the readiness response (Step 8), which blocks Submit.

#### Step 6 — Document Upload
**API:** `POST /api/insurance/documents/upload` (`multipart/form-data`)

| Field | Required | Notes |
|---|---|---|
| `documentType` | Yes | one of the 8 enum values; pass the exact `DocumentType` this upload slot represents |
| `file` | Yes | see constraints below |
| `documentNumber` | No | free text (e.g. the ID number printed on the document) |
| `expiresAt` | No | date, if the document itself has a printed expiry |
| `dependentPersonId` | No | set this only when uploading a document *about* a specific dependent, not the citizen |

**File constraints (exact backend rule):** max size **10 MB**; allowed extensions `.pdf`, `.jpg`, `.jpeg`, `.png`; allowed content-types `application/pdf`, `image/jpeg`, `image/png` (both extension **and** content-type must pass). Validate all of this client-side before starting the upload to avoid a wasted round trip.

**Upload UX:**
- Success (`200`): the response is the new `CitizenDocumentResponseDto` with `isCurrent: true` — update that document slot in place, no need to refetch the whole list.
- **Re-uploading the same `documentType` does not overwrite** — it becomes the new current document; the previous one is still retrievable as history but no longer counts toward readiness. If you show an upload history list, the old row's `isCurrent` will now be `false`.
- `400` (bad file type/size, or an invalid `dependentPersonId`): show the message inline on that slot, let the user pick a different file.
- `502` (Cloudinary unavailable): show a distinct "Storage is temporarily unavailable — try again in a moment" message, offer manual retry. Never auto-retry silently.

#### Step 8 — Readiness
**API:** `GET /api/insurance/enrollment/readiness`

Call this after **every** Profile save, document upload, and dependent add/end — never cache it across those actions.

Response fields and what they mean for the UI:

| Field | Meaning | Frontend use |
|---|---|---|
| `isReady` | The single flag that gates Submit | Enable the Submit button only when this is `true` |
| `applicationExists` | An active enrollment/application was found | If `false`, something is wrong with wizard state — this should not happen mid-flow |
| `profileComplete` | The 5 readiness fields from Step 4 are all set | If `false`, show the Profile step as incomplete and route the user back to it |
| `documentsComplete` | Every active+mandatory required document type has a current upload | If `false`, show the Documents step as incomplete |
| `dependentsValid` | Structural integrity only — effectively always `true` | No UI action needed; not something the user can "fix" |
| `isEligibleForCategory` | Age/marital-status/dependents rules for the selected category all pass | If `false`, show the eligibility violation messages (below) — these usually cannot be "fixed" by editing profile/documents; the citizen may need to pick a different category |
| `missingRequirements` | Human-readable, combines missing-document and eligibility messages | Render this list **verbatim** — these strings are already written for end users, e.g. `"Employment Letter is required."`, `"Minimum age for Student is 18 (you are 16)."` |
| `missingDocumentTypes` | Machine-readable subset — just the enum values still missing | Use this to put a "missing" badge on the exact document upload slot(s) |
| `eligibilityViolations` | The eligibility-specific subset of `missingRequirements` | Use if you want to visually separate "documents missing" from "you don't meet this category's rules" |

**Do not re-implement any of this logic client-side.** The backend readiness result is authoritative — the frontend's job is to render it, not recompute it (e.g. don't write your own "is the user old enough" check; wait for `eligibilityViolations`).

**Next/Review/Submit button enabling**, per the actual backend enforcement (see [§8](#8-important-frontend-rules) for the full rule):
- **Next** (moving between wizard steps): the backend enforces **no order at all** except at Submit — every step's own screen is always reachable. Enable "Next" unconditionally; use readiness flags only to show progress checkmarks, not to block navigation.
- **Review button:** always reachable.
- **Submit button:** enabled only when `readiness.isReady === true`.

#### Step 9 — Review
**API:** `GET /api/insurance/enrollment/summary`

One call returns everything the Review screen needs — do not call Profile/Dependents/Documents/Readiness separately here.

| Response field | Suggested screen section |
|---|---|
| `Profile` | "Personal Information" |
| `InsuranceCategory` | "Insurance Category" (name, description, the rules the citizen was measured against) |
| (derive an "Eligibility" summary from `Readiness.isEligibleForCategory` / `Readiness.eligibilityViolations`) | "Eligibility" |
| `Dependents` | "Dependents" (empty state if none) |
| `Documents` | "Documents" (show `isCurrent` ones; flag `MissingDocumentTypes` visually) |
| `Warnings` | "Warnings" — non-blocking notices (e.g. category has a `GuardianRequired` note); render as informational banners, never as errors, and never let them disable Submit |
| `ApplicationStatus` | "Application Status" (will be `Draft` at this point) |
| `Readiness` | drives the Submit button and any remaining missing-item list |

#### Step 10 — Submit
**API:** `PATCH /api/insurance/enrollment/submit`

- **When allowed:** only when `readiness.isReady === true`. The backend re-checks readiness itself regardless — never trust a stale client-side "ready" flag as a shortcut to skip re-fetching readiness right before enabling Submit.
- **If readiness is false anyway** (e.g. a stale client, or the user found a way to click a disabled-looking button): `400 Bad Request`, body:
  ```json
  {
    "title": "Request failed",
    "detail": "Application is not ready for submission.",
    "status": 400,
    "missingRequirements": ["Employment Letter is required."]
  }
  ```
  Render `missingRequirements` exactly as returned, the same way the Readiness screen does.
- **Successful response:** `200 OK`, `EnrollmentResponseDto` with `ApplicationStatus: "Submitted"`.
- **Other failure:** `409 Conflict` if the application is somehow no longer `Draft` (e.g. double-submit race) — refresh application state and show the current status instead of retrying blindly.

**The backend readiness check is authoritative — full stop.** Do not add any frontend-only submit-blocking rule that isn't reflected in the `readiness` response.

#### Step 11 — Application Tracking
**APIs:** `GET /api/insurance/status/{patientId}` (aggregated timeline) and/or `GET /api/insurance/applications/detail/{applicationId}` (full detail + review history) and/or `GET /api/insurance/applications/by-number/{applicationNumber}`.

**Status lifecycle actually implemented** (`ApplicationStatus`): `Draft → Submitted → UnderReview → (WaitingForDocuments ⇄ UnderReview) → Approved | Rejected`, plus `Cancelled` reachable from any non-terminal status.

| Status | What the citizen sees | Available actions | Can cancel? | Can submit again? |
|---|---|---|---|---|
| `Draft` | "Not yet submitted" | Continue editing / Submit | Yes (`PATCH .../cancel`) | Yes — this *is* the not-yet-submitted state |
| `Submitted` | "Submitted — waiting for review" | View only | Yes | No (already submitted; a second application is blocked with `409` while this one is non-terminal) |
| `UnderReview` | "Under review by Admin" | View only | Yes | No |
| `WaitingForDocuments` | "Admin needs more information" — show `CitizenVisibleReason` from the latest review entry if present | Upload additional documents (same Step 6 upload API — uploading doesn't change status by itself; only an Admin review action moves it back to `UnderReview`) | Yes | No |
| `Approved` | "Approved" + `DecisionReason` if present | Check for a card — see Step 12 | No (terminal) | No |
| `Rejected` | "Rejected" + `DecisionReason` (this is the only place a rejection reason is required to be shown — backend enforces it's non-empty for a Rejected decision) | Start a **brand-new** application (there is no "reopen") | No (terminal) | N/A — start fresh via `POST /api/insurance/enrollment/start` again |
| `Cancelled` | "Cancelled" | Start a brand-new application | No (terminal) | N/A |

`InternalNotes` on any review entry must **never** be shown to a citizen — the backend already omits it from a Patient-caller's response (it's simply `null`), so there's nothing to filter client-side, but don't build a UI element expecting it to ever be populated for this role.

#### Step 12 — Insurance Card Issuance
**Approval does NOT automatically issue a card.** This is the single most important business fact in this whole document — do not build any "card appears automatically" assumption anywhere.

The actual flow:
```
Application Approved
   ↓
Admin manually calls POST /api/insurance/cards/issue/{applicationId}
   ↓
DigitalInsuranceCard row(s) created (one for the citizen, one per dependent on that application)
   ↓
Citizen retrieves the card via GET /api/insurance/cards/current/{patientId}
```

- **Admin API:** `POST /api/insurance/cards/issue/{applicationId}` — Admin-only, not reachable from the citizen app at all.
- **Citizen APIs:**
  - `GET /api/insurance/cards/current/{patientId}` — the one currently-valid card; **`404` until an Admin has issued one, even though the application shows `Approved`**. Treat that `404` as a normal "not issued yet" empty state, not an error.
  - `GET /api/insurance/cards/{patientId}` — full card history.
  - `GET /api/insurance/cards/detail/{cardId}` — one card's full detail including status-change history.
- **Polling guidance:** if the "My Insurance Card" screen is reached while `applicationStatus == "Approved"` and the card call still 404s, show "Your application is approved — your card will appear here once it's issued," not a spinner or an error state.

---

### §3.1 — Student (fully worked example)

#### Business Assumption
`MVP BUSINESS ASSUMPTION — NOT AN OFFICIAL GOVERNMENT REGULATION`

The Student category's age range (18–26) and its single-document requirement are values an Admin configured in this platform's seed data — they are not a legally mandated definition of "student." An Admin can change these at any time via the category management screens, with no code deploy.

**Configured values** (from `InsuranceCategorySeeder.cs`, category code `STUDENT`):

| Rule | Value |
|---|---|
| Minimum Age | 18 |
| Maximum Age | 26 |
| Allowed Marital Status | any (no restriction configured) |
| Guardian Required | `false` |
| Dependents Allowed | `true` |
| Required Documents | National ID (`NationalId`) — mandatory, active |

#### Step 1 — Select Student
Same mechanics as [§3.0 Step 1](#step-1--select-category). The Student card in the category list shows "Ages 18–26" and "1 document required."

#### Step 2 — Start Enrollment
Same mechanics as [§3.0 Step 2](#step-2--start-enrollment). Request body:
```json
{ "insuranceCategoryId": "<Student category's Id from GET /api/insurance/categories>" }
```

#### Step 3 — Eligibility / Readiness
**API:** `GET /api/insurance/enrollment/readiness`

For Student specifically, the fields that matter beyond the generic ones:
- `isEligibleForCategory`: `false` if the citizen's age (derived from `Patient.DateOfBirth`) is `< 18` or `> 26`.
- `eligibilityViolations`: will contain e.g. `"Minimum age for Student is 18 (you are 16)."` or `"Maximum age for Student is 26 (you are 29)."` when out of range.
- No marital-status or dependents-related violation is possible for Student — the seed has no restriction on either.
- `missingRequirements` combines the above with any missing-document message (Step 5).

If `isEligibleForCategory` is `false` here, there is nothing the frontend can prompt the user to "fix" — display the violation and suggest browsing other categories, since age is not editable by the citizen.

#### Step 4 — Profile
Identical to [§3.0 Step 4](#step-4--profile). No Student-specific fields.

#### Step 5 — Required Documents
Determined the same way for every category — from `RequiredDocumentTypes` on the category object (or from `CategoryDocumentRequirementDto[]`/`DocumentRequirements` if you want the richer per-row detail: `IsActive`, `IsMandatory`, `DisplayOrder`, `DisplayName`, `HelpText`, `SampleDocumentUrl`).

- **Required** = `IsActive == true && IsMandatory == true`.
- **Optional** = `IsActive == true && IsMandatory == false` (shown, never blocks).
- **Inactive** = `IsActive == false` — do not render an upload slot for it at all.

For Student today:
```
Required:
  - National ID
```

**Do not assume this is permanent.** An Admin can add, remove, or reconfigure Student's required documents at any time (e.g. adding "Student Certificate" once that `DocumentType` value exists — see [§10](#10-backend-gaps-affecting-frontend)). Always render this list from the live API response, never from a hardcoded constant.

#### Step 6 — Document Upload
Identical to [§3.0 Step 6](#step-6--document-upload). For Student, the citizen uploads exactly one slot: National ID (`documentType: "NationalId"`).

#### Step 7 — Dependents
`DependentsAllowed == true` for Student, and `GuardianRequired == false`.

- Show the Dependents step as fully optional — a "Skip" affordance is appropriate.
- Adding a dependent has no negative effect on Student eligibility (dependents are allowed).
- There is no guardian-related UI requirement for this category at all — `GuardianRequired` is `false`, so don't render any guardian-specific fields or warnings here.

#### Step 8 — Readiness
Identical mechanics to [§3.0 Step 8](#step-8--readiness). For a Student applicant who is 22 years old, has a complete profile, and has uploaded their National ID:
```json
{
  "isReady": true,
  "missingRequirements": [],
  "missingDocumentTypes": [],
  "isEligibleForCategory": true,
  "eligibilityViolations": [],
  "profileComplete": true,
  "dependentsValid": true,
  "documentsComplete": true,
  "applicationExists": true
}
```

#### Step 9 — Review
Identical to [§3.0 Step 9](#step-9--review). The "Insurance Category" section shows "Student," the age range, and the single required document; "Warnings" will typically be empty for this category (no `GuardianRequired`, and it does have a configured document requirement so the "zero requirements" warning doesn't apply either).

#### Step 10 — Submit
Identical to [§3.0 Step 10](#step-10--submit).

#### Step 11 — Application Tracking
Identical to [§3.0 Step 11](#step-11--application-tracking) — the state machine is the same for every category; nothing about "Student" changes how status transitions work.

#### Step 12 — Insurance Card Issuance
Identical to [§3.0 Step 12](#step-12--insurance-card-issuance) — a Student's card is issued the same way as anyone else's, manually, by an Admin, after Approval.

---

### §3.2 — Government Employee

`MVP BUSINESS ASSUMPTION — NOT AN OFFICIAL GOVERNMENT REGULATION`

| Rule | Value |
|---|---|
| Minimum Age | 18 |
| Maximum Age | none |
| Allowed Marital Status | any |
| Guardian Required | `false` |
| Dependents Allowed | `true` |
| Required Documents | National ID, Employment Letter (both mandatory, active) |

- **Step 3 (Eligibility):** only a minimum-age check applies (`"Minimum age for Government Employee is 18 (you are {age})."` if under 18); no maximum-age, marital, or dependents violation is possible.
- **Step 5 (Documents):** two upload slots — National ID and Employment Letter — both required.
- **Step 7 (Dependents):** fully optional, no guardian UI.
- All other steps: identical to [§3.0](#30--common-enrollment-mechanics-applies-to-every-category) / [§3.1](#31--student-fully-worked-example).

### §3.3 — Private Employee

`MVP BUSINESS ASSUMPTION — NOT AN OFFICIAL GOVERNMENT REGULATION`

| Rule | Value |
|---|---|
| Minimum Age | 18 |
| Maximum Age | none |
| Allowed Marital Status | any |
| Guardian Required | `false` |
| Dependents Allowed | `true` |
| Required Documents | National ID, Employment Letter |

Identical shape to Government Employee — same eligibility check, same two required documents, same dependents/guardian behavior. Only `Name`/`Code`/`Description` differ between the two categories.

### §3.4 — Child

`MVP BUSINESS ASSUMPTION — NOT AN OFFICIAL GOVERNMENT REGULATION`

| Rule | Value |
|---|---|
| Minimum Age | none |
| Maximum Age | 18 |
| Allowed Marital Status | any |
| Guardian Required | **`true`** |
| Dependents Allowed | `true` |
| Required Documents | Birth Certificate (mandatory, active) |

- **Step 3 (Eligibility):** only a maximum-age check applies — `"Maximum age for Child is 18 (you are {age})."` if over 18.
- **Step 5 (Documents):** one slot — Birth Certificate.
- **Step 7 (Dependents/Guardian) — read carefully:** `GuardianRequired == true` here, but **this is informational only in the current backend** — it is surfaced as a non-blocking warning string in `EnrollmentSummaryResponseDto.Warnings` ("This category requires guardian verification - will be confirmed manually during Admin review") and is **never checked automatically against anything**. There is no guardian-relationship field the frontend can collect that the backend will validate.
  - **Do not** build a frontend-only blocking rule (e.g. "you must add a dependent with `RelationshipType: Guardian` before Submit") — the backend does not enforce this, so such a rule would only frustrate users without matching real behavior, and Submit will succeed without it as long as `readiness.isReady` is `true`.
  - **Do** show the warning text from `Summary.Warnings` on the Review screen so the citizen understands guardian verification happens manually later (during Admin review), not automatically now.
- All other steps: identical to [§3.0](#30--common-enrollment-mechanics-applies-to-every-category).

### §3.5 — Pensioner

`MVP BUSINESS ASSUMPTION — NOT AN OFFICIAL GOVERNMENT REGULATION`

| Rule | Value |
|---|---|
| Minimum Age | 60 |
| Maximum Age | none |
| Allowed Marital Status | any |
| Guardian Required | `false` |
| Dependents Allowed | `true` |
| Required Documents | National ID |

- **Step 3 (Eligibility):** only a minimum-age check — `"Minimum age for Pensioner is 60 (you are {age})."` if under 60.
- **Step 5 (Documents):** one slot — National ID.
- **Step 7 (Dependents):** fully optional, no guardian UI.
- All other steps: identical to [§3.0](#30--common-enrollment-mechanics-applies-to-every-category).

### §3.6 — Unemployed

`MVP BUSINESS ASSUMPTION — NOT AN OFFICIAL GOVERNMENT REGULATION`

| Rule | Value |
|---|---|
| Minimum Age | none |
| Maximum Age | none |
| Allowed Marital Status | any |
| Guardian Required | `false` |
| Dependents Allowed | `true` |
| Required Documents | National ID |

- **Step 3 (Eligibility):** this category has **no `InsuranceCategoryEligibilityRule` row at all** in the current seed — there is no age, marital-status, or dependents restriction whatsoever. `isEligibleForCategory` can only be `false` here if a future Admin configuration adds a rule.
- **Step 5 (Documents):** one slot — National ID.
- **Step 7 (Dependents):** fully optional, no guardian UI.
- All other steps: identical to [§3.0](#30--common-enrollment-mechanics-applies-to-every-category).

### §3.7 — Self Employed

`MVP BUSINESS ASSUMPTION — NOT AN OFFICIAL GOVERNMENT REGULATION`

| Rule | Value |
|---|---|
| Minimum Age | 18 |
| Maximum Age | none |
| Allowed Marital Status | any |
| Guardian Required | `false` |
| Dependents Allowed | `true` |
| Required Documents | National ID |

- **Step 3 (Eligibility):** only a minimum-age check — `"Minimum age for Self Employed is 18 (you are {age})."` if under 18.
- **Step 5 (Documents):** one slot — National ID.
- **Step 7 (Dependents):** fully optional, no guardian UI.
- All other steps: identical to [§3.0](#30--common-enrollment-mechanics-applies-to-every-category).

### §3.8 — Widow

`MVP BUSINESS ASSUMPTION — NOT AN OFFICIAL GOVERNMENT REGULATION`

| Rule | Value |
|---|---|
| Minimum Age | none |
| Maximum Age | none |
| Allowed Marital Status | **Widowed only** |
| Guardian Required | `false` |
| Dependents Allowed | `true` |
| Required Documents | National ID, Death Certificate |

- **Step 3 (Eligibility):** this is the one category where the **marital-status check** actually matters. `isEligibleForCategory` is `false`, with `"Widow requires marital status to be one of: Widowed."`, if the citizen's `CitizenProfile.MaritalStatus` is set to anything other than `Widowed`. **Note the interaction with Step 4:** this check is only evaluated once `MaritalStatus` is non-null — if the profile is still incomplete, the citizen sees the profile-completeness message first, not a marital-status violation (the backend deliberately avoids showing two confusing messages for the same root cause).
- **Step 5 (Documents):** two slots — National ID and Death Certificate.
- **Step 7 (Dependents):** fully optional, no guardian UI.
- All other steps: identical to [§3.0](#30--common-enrollment-mechanics-applies-to-every-category).

### §3.9 — Person With Disability

`MVP BUSINESS ASSUMPTION — NOT AN OFFICIAL GOVERNMENT REGULATION`

| Rule | Value |
|---|---|
| Minimum Age | none |
| Maximum Age | none |
| Allowed Marital Status | any |
| Guardian Required | `false` |
| Dependents Allowed | `true` |
| Required Documents | National ID, Disability Certificate |

- **Step 3 (Eligibility):** same as Unemployed — **no `InsuranceCategoryEligibilityRule` row exists** for this category in the current seed, so there is no automated eligibility check beyond the required documents. `isEligibleForCategory` will always be `true` for this category today, regardless of the citizen's age/marital status/dependents.
- **Step 5 (Documents):** two slots — National ID and Disability Certificate.
- **Step 7 (Dependents):** fully optional, no guardian UI.
- All other steps: identical to [§3.0](#30--common-enrollment-mechanics-applies-to-every-category).

---

## 4. Category Comparison Matrix

`MVP BUSINESS ASSUMPTIONS — NOT OFFICIAL GOVERNMENT REGULATIONS.` All values below are the current seed configuration and are Admin-editable without a deploy — re-verify against `GET /api/insurance/categories` before relying on this table in production.

| Category | Min Age | Max Age | Marital Rule | Guardian | Dependents | Required Documents |
|---|---|---|---|---|---|---|
| Government Employee | 18 | — | any | No | Yes | National ID, Employment Letter |
| Private Employee | 18 | — | any | No | Yes | National ID, Employment Letter |
| Student | 18 | 26 | any | No | Yes | National ID |
| Child | — | 18 | any | **Yes (informational only)** | Yes | Birth Certificate |
| Pensioner | 60 | — | any | No | Yes | National ID |
| Unemployed | — | — | any (no rule row) | No | Yes | National ID |
| Self Employed | 18 | — | any | No | Yes | National ID |
| Widow | — | — | **Widowed only** | No | Yes | National ID, Death Certificate |
| Person With Disability | — | — | any (no rule row) | No | Yes | National ID, Disability Certificate |

---

## 5. API Flow Matrix

| Screen | Action | API | Method | When Called | Success | Failure |
|---|---|---|---|---|---|---|
| Login | Sign in | `/api/auth/login` | POST | On form submit | `200` → store JWT, navigate to dashboard | `401` generic invalid-credentials message |
| Dashboard / entry | Check for an existing enrollment | `/api/insurance/enrollment/current` | GET | On dashboard load, before showing "Start Enrollment" | `200` → resume into existing flow | `404` → show "Start Enrollment" |
| Category List | Load categories | `/api/insurance/categories` | GET | On screen mount | `200` → render cards | (none expected — empty list handled as an empty state) |
| Category List | Select a category | `/api/insurance/enrollment/start` | POST | On card tap | `200` → advance to wizard | `400` inactive · `409` existing application → redirect into it · `404` bad id |
| Profile step | Load profile | `/api/profile` | GET | On step mount | `200` → prefill form | `404` (should not happen) |
| Profile step | Save profile | `/api/profile` | PUT | On "Save"/"Next" | `200` → refresh readiness | `400` field validation |
| Dependents step | Load dependents | `/api/insurance/dependents/{patientId}` | GET | On step mount | `200` → render list | `404` no access (shouldn't happen for own id) |
| Dependents step | Add dependent | `/api/insurance/dependents` | POST | On "Add" form submit | `200` → append to list, refresh readiness | `400` validation |
| Dependents step | End a dependent relationship | `/api/insurance/dependents/{relationshipId}/end` | PATCH | On "Remove"/confirm | `200` → mark ended | `404` not sponsor · `409` already ended |
| Documents step | Load documents | `/api/insurance/documents/{patientId}` | GET | On step mount | `200` → mark uploaded slots | `404` no access |
| Documents step | Upload a document | `/api/insurance/documents/upload` | POST (multipart) | On file select + confirm | `200` → mark slot uploaded, refresh readiness | `400` bad file · `502` storage unavailable |
| Any step | Refresh readiness | `/api/insurance/enrollment/readiness` | GET | After every Profile save / dependent change / document upload | `200` → update `isReady` & missing lists | `404` no active enrollment |
| Review step | Load summary | `/api/insurance/enrollment/summary` | GET | On step mount | `200` → render all sections | `404` no active enrollment |
| Review step | Submit | `/api/insurance/enrollment/submit` | PATCH | On "Submit" tap | `200` → navigate to tracking screen | `400` + `missingRequirements` · `404` no enrollment · `409` wrong status |
| Application Tracking | Load status | `/api/insurance/status/{patientId}` | GET | On screen mount / pull-to-refresh | `200` → render timeline | `404` no access |
| Application Tracking | Load detail | `/api/insurance/applications/detail/{applicationId}` | GET | On "view details" | `200` → render full detail + review history | `404` no access |
| Application Tracking | Cancel | `/api/insurance/applications/{applicationId}/cancel` | PATCH | On "Cancel" confirm | `200` → status becomes `Cancelled` | `409` already terminal |
| Insurance Card | Load current card | `/api/insurance/cards/current/{patientId}` | GET | On screen mount, once status is `Approved` | `200` → render card | `404` → "not issued yet" empty state |
| Insurance Card | Load card history | `/api/insurance/cards/{patientId}` | GET | On "history" tap | `200` → render list | `404` no access |
| Insurance Card | Load card detail | `/api/insurance/cards/detail/{cardId}` | GET | On a history row tap | `200` → render detail + status history | `404` no access |

*(Admin-only actions — Issue Card, Review Application, Suspend/Revoke/etc. — are out of scope for the citizen app and are not listed here; see [§11](#11-final-page-by-page-blueprint) Admin section.)*

---

## 6. Frontend State Machine

```
Category Selected
   ↓  POST /api/insurance/enrollment/start
Enrollment Started (Draft)
   ↓  GET /api/insurance/enrollment/readiness
   ├─ profileComplete: false ──────────────► Complete Missing Requirements (Profile step)
   ├─ documentsComplete: false ────────────► Complete Missing Requirements (Documents step)
   └─ isEligibleForCategory: false ────────► Complete Missing Requirements (age/marital — often not user-fixable; suggest another category)
                                                   ↓ (user edits profile / uploads docs)
                                              GET .../readiness again
                                                   ↓
                                                 Ready (isReady: true)
                                                   ↓
                                                 Review  (GET .../summary)
                                                   ↓
                                                 Submit  (PATCH .../submit)
                                                   ↓
                                                 Submitted
                                                   ↓  (Admin action)
                                                 UnderReview
                                          ┌────────┼────────┐
                                          ↓        ↓        ↓
                              WaitingForDocuments  Rejected  Approved
                                          │                    ↓
                              (citizen uploads more docs)  (Admin issues card)
                                          ↓                    ↓
                                    UnderReview again      Card Issued
```

Notes:
- **Cancelled** is reachable from `Draft`, `Submitted`, `UnderReview`, and `WaitingForDocuments` at any time via the citizen's own Cancel action — not drawn above to keep the happy-path readable, but every non-terminal box has that exit available.
- **Rejected** and **Cancelled** are both terminal — the only forward path from either is starting a brand-new application (back to "Category Selected").
- **WaitingForDocuments → UnderReview** is an **Admin** action, not something the citizen's document upload triggers automatically — uploading more documents while `WaitingForDocuments` does not by itself change the status.

---

## 7. UI States

| Screen | Loading | Empty | Incomplete | Ready | Error | Success | Disabled | Read-only |
|---|---|---|---|---|---|---|---|---|
| Category List | Skeleton cards | "No insurance categories are currently available." | — | — | Generic fetch-failed banner | — | — | — |
| Profile | Skeleton form | New patient: all fields blank (not an error) | Missing readiness-required fields — show inline hint, not a hard error | All 5 readiness fields set | `400` field errors inline | Toast "Profile updated" | — | Identity fields (`NationalId` etc.) always read-only |
| Dependents | Skeleton rows | "No dependents registered yet." | — | — | `400`/`404` inline | New row appended | "End Relationship" hidden on already-ended rows | Ended relationships shown but not editable |
| Document Upload | Per-slot spinner + real % progress | "No documents uploaded yet." per slot | Slot shows "Required — not yet uploaded" badge | Slot shows "Current" + Review-Status badge (always `Pending` today — see [§10](#10-backend-gaps-affecting-frontend)) | `400` wrong type/size inline on the slot; `502` distinct "storage unavailable" banner | New/updated row in place, no refetch needed | Upload button disabled while a request for that slot is in flight | — |
| Readiness (implicit, drives Submit) | — (fetched silently in the background) | — | `isReady: false` — render `missingRequirements` as a checklist | `isReady: true` — show all-green checklist | `404` no active enrollment (routing bug — should not surface to user) | — | Submit button disabled while `isReady: false` | — |
| Review | Skeleton sections | — | Missing-item banner mirrors readiness | Full summary rendered, Submit enabled | `404` no active enrollment | — | Submit disabled until ready | Everything on this screen is read-only except the Submit action itself |
| Submission Result | Spinner while `PATCH .../submit` is in flight | — | — | `200` → success screen with `ApplicationNumber` | `400` → render `missingRequirements`, route back into the flow | "Application submitted" confirmation | — | — |
| Application Tracking | Skeleton timeline | No application ever submitted → "Start Enrollment" CTA | `WaitingForDocuments` → show what's needed + upload affordance | Terminal states (`Approved`/`Rejected`/`Cancelled`) → view-only | `404` no access | — | Cancel button hidden once terminal | All statuses other than `Draft` are effectively read-only from the citizen's side except Cancel/upload |
| Insurance Card | Skeleton card shape | "No insurance card issued yet. Once your application is approved, your card will appear here." (this is the expected state immediately after Approval, before Admin issues) | — | Card rendered with `CardNumber`, `HolderFullName`, `IssuedAt`/`ExpiresAt`, status badge | `404` no access | — | — | Entire screen is view-only — no citizen-facing lifecycle actions exist (see [§10](#10-backend-gaps-affecting-frontend)) |

---

## 8. Important Frontend Rules

### DO
- Use the backend `readiness` response as the **single source of truth** for whether Submit is allowed.
- Render each category's required documents **dynamically** from `RequiredDocumentTypes` / `DocumentRequirements` on every load — never from a hardcoded list per category.
- Respect `IsActive` on a document requirement — an inactive requirement gets no upload slot at all.
- Respect `IsMandatory` — show optional requirements, but never block Submit on them.
- Sort document requirements by `DisplayOrder`.
- Use `DisplayName` when set on a requirement; fall back to the static label (e.g. `NationalId → "National ID"`) only when it's `null`.
- Show `HelpText` inline next to the upload field when present.
- Show `SampleDocumentUrl` as a "view sample" link when present.
- Re-fetch `readiness` after every Profile save, document upload, and dependent add/end.
- Treat a `404` from `GET /api/insurance/cards/current/{patientId}` on an Approved application as a normal "not issued yet" state.

### DO NOT
- Hardcode "Student = National ID" (or any other category's document list) as a permanent constant — an Admin can change it without a deploy.
- Hardcode eligibility rules (age ranges, marital-status restrictions) anywhere in frontend logic.
- Re-implement any part of the backend's eligibility/readiness calculation client-side — always defer to the `readiness` API response.
- Assume Approval automatically creates a card — it does not; card issuance is a separate, manual Admin action.
- Assume QR-code or PDF/download functionality exists for the Insurance Card — neither is implemented in the backend today (see [§10](#10-backend-gaps-affecting-frontend)).
- Build a frontend-only blocking rule for `GuardianRequired` (e.g. requiring a `Guardian`-type dependent before Submit) — the backend never enforces this; it is a warning only.
- Enforce a wizard step order the backend doesn't enforce — every step's underlying API is independently callable at any time; only Submit itself is gated.

---

## 9. MVP Assumptions vs Backend Facts

### Backend Facts
*(confirmed directly from the current code — not configurable business data, not subject to Admin editing)*

| Fact | Detail |
|---|---|
| Enrollment step order | Not enforced by the backend at all, except Submit (gated on readiness) |
| Submission gate | `readiness.isReady === true`, computed server-side, identical logic for both submit endpoints |
| Card issuance trigger | Manual Admin action (`POST /api/insurance/cards/issue/{applicationId}`), never automatic on Approval |
| Document "current" selection | Most recent upload per `(DocumentType, DependentPersonId)` — re-upload never overwrites, it supersedes |
| File constraints | ≤10 MB; `.pdf/.jpg/.jpeg/.png`, matching content-type |
| Profile update semantics | Full replace — omitted/null fields are cleared, not left unchanged |
| Application status terminal set | `Approved`, `Rejected`, `Cancelled` — no reopen path from any of the three |
| One active application per patient | Enforced with `409 Conflict` on a second Draft creation attempt |
| Anti-enumeration | Every ownership-denied/nonexistent-resource case returns the same 404 shape as a genuinely missing resource |

### MVP Business Assumptions
*(`MVP BUSINESS ASSUMPTIONS — NOT OFFICIAL GOVERNMENT REGULATIONS` — real, currently-active seed configuration, but Admin-editable and not a legal mandate)*

| Assumption | Detail |
|---|---|
| The 9 seeded categories and their names | Government Employee, Private Employee, Student, Child, Pensioner, Unemployed, Self Employed, Widow, Person With Disability |
| Every category's age range | See [§4](#4-category-comparison-matrix) |
| Every category's required-document list | See [§4](#4-category-comparison-matrix) — several are intentionally reduced sets because a matching `DocumentType` (e.g. a Student Certificate, a pension certificate, a business license) doesn't exist yet in the current 8-value enum |
| Widow's marital-status restriction | `Widowed` only |
| Child's guardian requirement | Configured as `true`, but currently informational-only in enforcement |
| Card validity period | 12 months from issuance (`Insurance:Card:DefaultValidityMonths` in configuration) |
| JWT session length | 7 days (`JwtSettings:ExpiresInDays` in configuration) |

Both tables above should be re-verified against the live `GET /api/insurance/categories` response (and, for session/card length, an Admin-facing settings view if one exists) before treating any specific number as permanent in a design mockup.

---

## 10. Backend Gaps Affecting Frontend

Only confirmed limitations that materially affect what the frontend can build against today:

- **`NOT IMPLEMENTED` — QR code generation.** No QR image/payload logic exists anywhere in the backend. Do not design a "scan your card" citizen-facing QR display — there is nothing to render one from (only an internal `VerificationToken` that is never returned to the citizen).
- **`NOT IMPLEMENTED` — Card PDF / download / Wallet pass.** There is no `GET /api/insurance/cards/{cardId}/pdf` endpoint (despite it being referenced elsewhere in this repo's docs) and no Apple/Google Wallet integration. Do not build a "Download Card" or "Add to Wallet" button.
- **`NOT IMPLEMENTED` — Document review workflow.** `ReviewStatus` on an uploaded document exists in the API response but no endpoint ever moves it away from `Pending`. Do not build an "Approved"/"Rejected" document badge that expects to ever show anything but `Pending` in practice, and do not build an Admin "approve this document" action against a nonexistent endpoint.
- **`NOT IMPLEMENTED` — Cross-patient Admin application queue.** There is no "all pending applications" endpoint — an Admin review screen needs a `patientId` (or `applicationId`/`applicationNumber`) from elsewhere before it can load anything. Do not design an Admin landing page around a live queue unless a new endpoint is added.
- **`NOT IMPLEMENTED` — Self-service card actions for citizens.** Suspend/Reactivate/Revoke/Renew/Replace/Rotate Token are all Admin-only. The citizen's Insurance Card screen is view-only — do not add any lifecycle buttons there.
- **`NOT IMPLEMENTED` — Document delete or in-place replace.** There is no delete endpoint for a document (or a dependent, for that matter — only "end" the relationship). Do not design a delete affordance for an uploaded document.
- **`NOT IMPLEMENTED` — Conditional document requirements.** A requirement is either unconditionally required or not required at all — there is no "only required if married" logic evaluated anywhere, even though the data model has an unused scaffold for it.
- **Partial — Guardian requirement enforcement.** `GuardianRequired` exists as category configuration and is surfaced as a warning string, but nothing automated ever checks it. See [§8](#8-important-frontend-rules) DO NOT list.
- **Application-detail document/dependent lists.** `GET /api/insurance/applications/detail/{applicationId}` returns only `DocumentCount`/`DependentCount` (numbers), not the actual submitted document/dependent rows. If a citizen tracking screen wants to show "what I submitted," it can only show the patient's **current** documents/dependents (via the separate Documents/Dependents endpoints), which may have changed since submission — don't present that as "exactly what was reviewed."

---

## 11. Final Page-by-Page Blueprint

### Citizen

**1. Login**
- APIs: `POST /api/auth/login`
- Components: NationalId input, password input, submit button
- Actions: Sign in
- Validation: 14-digit NationalId format (client-side pre-check is a nice-to-have; the server re-validates regardless)
- Navigation: → Dashboard on success

**2. Profile**
- APIs: `GET /api/profile`, `PUT /api/profile`
- Components: read-only identity block, editable form (6 fields)
- Actions: Save (full replace)
- Validation: max-lengths, phone format on `EmergencyContactPhone` — all fields optional at the API level
- Navigation: reachable standalone from the dashboard, or as the Profile step inside the wizard

**3. Insurance Categories**
- APIs: `GET /api/insurance/categories`, `GET /api/insurance/enrollment/current` (pre-check)
- Components: category card grid
- Actions: Select a category
- Validation: none (read-only screen)
- Navigation: → Category Details / straight into `POST .../enrollment/start`, or → existing enrollment if one is already active

**4. Category Details** *(optional standalone screen, or folded into the card itself)*
- APIs: `GET /api/insurance/categories/{id}` (or reuse the list response)
- Components: full rule breakdown (age, marital, guardian, dependents, documents)
- Actions: "Start Enrollment"
- Validation: none
- Navigation: → Eligibility/Enrollment wizard

**5. Eligibility** *(the readiness view of the wizard — not a separate API, see §3.0 Step 3/8)*
- APIs: `GET /api/insurance/enrollment/readiness`
- Components: eligibility-violation list (if any)
- Actions: none directly — informational, routes the user to Profile/Documents/another category
- Validation: n/a
- Navigation: → Profile step (if `profileComplete: false`) or → Documents step (if `documentsComplete: false`) or → Review (if ready)

**6. Dependents**
- APIs: `GET /api/insurance/dependents/{patientId}`, `POST /api/insurance/dependents`, `PATCH /api/insurance/dependents/{relationshipId}/end`
- Components: dependent list/table, "Add Dependent" form
- Actions: Add, End Relationship (confirm dialog)
- Validation: 4 required name fields, DateOfBirth, Gender, RelationshipType; NationalId optional but 14-digit if given
- Navigation: → Documents step or → Review (always skippable)

**7. Documents**
- APIs: `GET /api/insurance/documents/{patientId}`, `POST /api/insurance/documents/upload`
- Components: one upload slot per `RequiredDocumentTypes` entry (+ optional ones if desired), file picker, progress bar
- Actions: Upload / re-upload
- Validation: file type/size client-checked before upload
- Navigation: → Review

**8. Review**
- APIs: `GET /api/insurance/enrollment/summary`
- Components: sectioned summary (Personal Info, Category, Eligibility, Dependents, Documents, Warnings)
- Actions: Submit
- Validation: Submit disabled unless `readiness.isReady`
- Navigation: → Submission Result

**9. Submission Result**
- APIs: `PATCH /api/insurance/enrollment/submit`
- Components: success confirmation with `ApplicationNumber`, or an error state rendering `missingRequirements`
- Actions: "View Application" / "Fix Missing Items" (routes back into the wizard)
- Validation: n/a (handled server-side)
- Navigation: → Application Tracking

**10. Application Tracking**
- APIs: `GET /api/insurance/status/{patientId}`, `GET /api/insurance/applications/{patientId}`, `GET /api/insurance/applications/detail/{applicationId}`, `GET /api/insurance/applications/by-number/{applicationNumber}`, `PATCH /api/insurance/applications/{applicationId}/cancel`
- Components: status timeline, application list/history, detail view with review history
- Actions: Cancel (non-terminal only)
- Validation: n/a
- Navigation: → Waiting for Documents view (if status is `WaitingForDocuments`) or → Insurance Card (if `Approved` and a card exists)

**11. Waiting for Documents**
- APIs: same as Documents (§7) + Application Tracking (§10) for context
- Components: banner explaining what Admin requested (`CitizenVisibleReason` from the latest review entry), upload slots
- Actions: Upload additional documents
- Validation: same file rules as §7
- Navigation: back to Application Tracking (status changes to `UnderReview` only once an Admin reviews again — not automatically on upload)

**12. Insurance Card**
- APIs: `GET /api/insurance/cards/current/{patientId}`, `GET /api/insurance/cards/{patientId}`, `GET /api/insurance/cards/detail/{cardId}`
- Components: card visual (CardNumber, HolderFullName, IssuedAt/ExpiresAt, status badge), history list
- Actions: view only — no lifecycle actions available to a citizen
- Validation: n/a
- Navigation: terminal screen for this flow

### Admin

**1. Insurance Applications**
- APIs: `GET /api/insurance/applications/{patientId}` *(per-patient only — no cross-patient queue, see §10)*
- Components: application list for a known patient
- Actions: open an application
- Validation: n/a
- Navigation: → Application Details

**2. Application Details**
- APIs: `GET /api/insurance/applications/detail/{applicationId}` or `.../by-number/{applicationNumber}`, plus `GET /api/insurance/documents/{patientId}`, `GET /api/insurance/dependents/{patientId}`, `GET /api/insurance/eligibility/{patientId}`, `GET /api/insurance/verification/{patientId}/latest` for supporting context
- Components: application summary, review history (`InternalNotes` visible for Admin), linked citizen documents/dependents (current state, not a submission snapshot — see §10)
- Actions: navigate to Review
- Validation: n/a
- Navigation: → Review Application

**3. Review Application**
- APIs: `PATCH /api/insurance/applications/{applicationId}/review`
- Components: status-transition selector (only valid next states per the state machine), `CitizenVisibleReason` field, `InternalNotes` field
- Actions: Move to UnderReview, Request Documents (`WaitingForDocuments`), Approve, Reject
- Validation: `CitizenVisibleReason` required when rejecting; only valid transitions selectable
- Navigation: → Application Details (refreshed) → Issue Insurance Card (once Approved)

**4. Issue Insurance Card**
- APIs: `POST /api/insurance/cards/issue/{applicationId}`
- Components: "Issue Card" action, only enabled when application status is `Approved` and no non-terminal card already exists for the patient/dependents
- Actions: Issue
- Validation: `409` if not Approved or a card already exists — surface the real reason text
- Navigation: → Insurance Card Details

**5. Insurance Card Details**
- APIs: `GET /api/insurance/cards/detail/{cardId}`, plus lifecycle actions `PATCH .../suspend`, `PATCH .../reactivate`, `PATCH .../revoke`, `POST .../renew`, `POST .../replace`, `PATCH .../rotate-token`
- Components: card detail, status-change history, lifecycle action bar (buttons enabled per current status)
- Actions: Suspend, Reactivate, Revoke, Renew, Replace, Rotate Token
- Validation: reason required for Suspend/Revoke; `ReplacementReason` required for Replace; action availability follows the state machine in the backend doc
- Navigation: terminal screen for this flow
