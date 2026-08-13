# Frontend Integration Guide

**Version 1.0** · Status: Source of truth, grounded in the current backend contract · Audience: Frontend Engineers only

---

## 1. Introduction

### Purpose

This guide lets a Frontend Engineer build the entire Medical System application — Citizen Insurance portal, Doctor workspace, and Admin console — against the real, implemented backend, without needing to ask a backend question. Every route, field, validation rule, status value, and business rule below is taken directly from the current API contract (controllers, DTOs, entities, Swagger) and from the product's existing design documentation. Nothing here is aspirational; where a capability doesn't exist yet, this guide says so explicitly (§17) instead of inventing it.

### Intended Audience

Frontend Engineers only. This is not a backend design document — it does not describe entities, database schema, repositories, service internals, or EF Core configuration. Where backend reasoning is relevant to a UI decision (e.g., why an error is a 404 instead of a 403), it's stated in one sentence, never as an implementation walkthrough.

### How to Use This Document

- **This is the single consolidated reference across both halves of the product**: the Citizen-facing Insurance domain (Registration → Profile → Dependents → Enrollment → Documents → Application → Card) and the Doctor/Admin-facing Clinical domain (Patient Search → Chart → Visits → Attachments → Assignments → Audit).
- The Clinical domain already has a mature, screen-by-screen UX design library at `docs/ux/` (`01-design-system.md` + `02-screen-inventory.md` + 19 individual screen specs under `docs/ux/screens/`). This guide **consolidates the frontend-actionable facts** from that library into the structure below and cites it for deeper visual/interaction rationale (mockup prompts, alternative-design tradeoffs) — it does not duplicate that content wholesale.
- The Insurance domain has no separate UX library; every Insurance section below is authored fresh from the API contract and is the authoritative source for that domain.
- **Three roles exist in the entire system: `Patient`, `Doctor`, `Admin`.** There is no fourth role. Where the product brief might imply a "Reception" role, none exists — front-desk-style actions (patient lookup, assignment) are performed by Doctor/Admin today.
- Gaps are called out inline (a shaded "**Not implemented**" note) and consolidated in §17. Do not design around a capability flagged as a gap without a backend conversation first.

---

## 2. Application Overview

The product is really **two domains sharing one identity system**, at different levels of frontend maturity:

1. **Insurance** (Citizen-facing) — a citizen registers, completes their profile, optionally registers dependents, browses insurance categories, runs an enrollment wizard, uploads documents, submits an application, tracks its review, and — once approved — receives a Digital Insurance Card. This is the domain built and documented this sprint; it has real screens to design against end-to-end.
2. **Clinical** (Doctor/Admin-facing) — a Doctor searches for a patient, reviews their chart, creates/manages visits (diagnosis, notes, medications, attachments), and an Admin manages Doctor↔Patient assignments and reviews the compliance audit trail. This domain is fully designed already in `docs/ux/`.

**Citizen Journey** (Insurance — see §4/§5 for full detail):
```
Register → Auto-login → Complete Profile → (optional) Register Dependents
   → Browse Insurance Categories → Start Enrollment Wizard
   → Step: Category confirmed → Step: Documents (upload required + optional)
   → Step: Readiness check → Step: Review & Submit
   → Application: Submitted → UnderReview → (WaitingForDocuments ⇄ UnderReview)* → Approved/Rejected
   → (if Approved) Digital Insurance Card issued by Admin → Citizen views/downloads card
```
The citizen can track application status at any point (`GET /api/insurance/status/{patientId}`) and view/manage documents and dependents independently of the wizard.

**Insurance — Admin side**: Admin manages the reference data (Insurance Categories: general info, eligibility rules, required documents) that the wizard reads from, reviews submitted applications, and manages the card lifecycle (issue, suspend, reactivate, revoke, renew, replace, rotate token).

**Appointments**: **Not implemented.** There is no scheduling/booking concept anywhere in the backend. A `Visit` (see below) is created directly with a doctor, patient, and date already decided — there is nothing to build a calendar/slot-booking UI against. See §17.

**Clinic Visit / Consultation**: These are the same backend concept. A `Visit` **is** the encounter — `VisitType` is `Consultation`, `FollowUp`, or `Emergency`, and the visit itself carries the clinical narrative (`Diagnosis`, `Notes`, `RequiredTests`) and any prescribed `Medications`. A Doctor creates a Visit, then separately edits its clinical note and adds medications as the encounter progresses, then transitions its status (`Scheduled → InProgress → Completed`, or `→ Cancelled`).

**Results**: Represented by **Attachments** — files (lab PDFs, imaging, scans) attached to a specific Visit. There is no separate "Results" module; results are just attachments on the encounter they support.

**Administration**: Two independent admin surfaces — Clinical Admin (Doctor↔Patient assignments, Audit Log/Dashboard, all Admin-only) and Insurance Admin (Category configuration, Application Review, Card lifecycle, all Admin-only, with Eligibility checks and Card verification also reachable by Doctor).

**One structural fact that shapes every screen decision below**: the **Citizen/Patient role has no designed clinical UI at all today** — the backend supports a Patient reading their own Medical Summary/Visit History/Visits (the API exists), but no screen has been designed for it (flagged as Future in `docs/ux` Module 9). Patient-facing UI that exists today is entirely the Insurance domain.

---

## 3. Navigation Structure

Three portals, matching the three real roles. There is no fourth "Reception Portal" — that role does not exist in this system.

### Citizen Portal (Patient)

| | |
|---|---|
| **Navigation menu** | Home/Dashboard · My Profile · My Dependents · My Documents · Insurance Enrollment · My Applications · My Insurance Card |
| **Pages** | Register · Login · Profile (view/edit) · Dependents (list/add/end) · Documents (list/upload) · Categories Browse · Enrollment Wizard (multi-step) · My Applications (list/detail/status) · My Card (list/detail) |
| **Entry points** | Public: Login, Register. Post-login: role-based landing (Insurance dashboard). |
| **User flow** | Register → auto-login → land on Insurance dashboard → complete Profile (gates enrollment) → optionally add Dependents → Browse Categories → Start Enrollment → complete wizard steps → Submit → track status → (once Approved and a card is issued by Admin) view Card. |
| **Not implemented** | No clinical "Patient Portal" screens exist yet (own Medical Summary/Visit History) — API exists, no design. See §17. |

### Doctor Portal

| | |
|---|---|
| **Navigation menu** | Patient Search · My Patients (per `docs/ux` §13 — no "My Visits Today," no such endpoint exists) |
| **Pages** | Patient Search · Patient Medical Summary · Patient Visit History · Visit Detail · Edit Clinical Note · New Visit · Add Medications · Attachments Panel · Upload Attachment · Attachment Viewer · Printable Prescription · Insurance Verification (point-of-care) · Card Verification (point-of-care) |
| **Entry points** | Post-login landing = Doctor Workspace (Patient Search + My Patients only — see gap note below) |
| **User flow** | Search patient by National ID → Medical Summary → New Visit or drill into a past Visit → Edit Clinical Note / Add Medications / Upload Attachments → Update Visit Status. |
| **Not implemented** | No "today's schedule" widget — no endpoint returns a doctor's own visits directly (only per-patient). Design the landing around Patient Search + My Patients only (`docs/ux` §Module 7). |

### Admin Portal

| | |
|---|---|
| **Navigation menu** | Audit Dashboard · Audit Log · Patient Search · Doctor Assignments · **Insurance:** Categories · Applications (Review) · Cards |
| **Pages** | Audit Dashboard · Audit Log Explorer · Audit Log Detail · Chain Integrity Verification · My Patients (any doctor's roster) · Assign Patient dialog · Remove Assignment dialog · Insurance Category List/Detail (4 tabs: General, Eligibility, Required Documents, Preview) · Application Review list/detail · Card issuance/lifecycle actions |
| **Entry points** | Post-login landing = Audit Dashboard (richest Admin-scoped data available) |
| **User flow** | Land on Audit Dashboard → drill into Audit Log for investigation, or navigate to Doctor Assignments / Patient Search for care-team admin, or navigate to Insurance for category configuration, application review, and card lifecycle management. |

---

## 4. Screen Specifications

Organized by portal, then module. Clinical-domain screens (already fully designed) are given a condensed spec here with a citation to their full `docs/ux/screens/*.md` document for visual mockups, UX rationale, and alternative-design discussion. Insurance-domain screens are specified fully here (no separate design doc exists). Global state patterns (errors, empty states, loading) referenced per-screen are cataloged once in §12–§14 — not repeated per screen.

### 4.1 Citizen Portal — Insurance Domain

#### Login / Patient Self-Registration / Session Expired

Shared across all three roles — see docs/ux/screens/login.md, patient-self-registration.md, session-expired-interstitial.md for full specs (layout, components, error states, Stitch prompts). Key facts for the Insurance build:
- Registration (`POST /api/auth/register`) auto-logs in on success — no email verification step exists.
- Login error is one generic message for both unknown ID and wrong password (`"National ID or password is incorrect."`) — no enumeration signal, never split into two messages.
- No "forgot password" capability exists anywhere in the backend — do not design a reset flow.

#### My Profile

| | |
|---|---|
| **Purpose** | View and edit the citizen's extended profile — required before enrollment can proceed. |
| **Entry Point** | Citizen dashboard "My Profile"; also linked from the Enrollment Wizard when profile is incomplete. |
| **Permissions** | `Patient` only, always own profile — `PatientId` from claims, never a route parameter. |
| **APIs** | `GET /api/profile`, `PUT /api/profile` (full replace). |
| **Fields** | Occupation (text), MaritalStatus (enum select), Nationality (text), EmergencyContactName (text), EmergencyContactPhone (text) — see §6.2 for full field table. |
| **Validation** | Full-replace semantics — omitting/nulling a field on `PUT` clears it. Mirror this exactly: a "Save" that doesn't touch a field must still send its current value, not omit it. |
| **Empty State** | A brand-new Patient has a profile record with all fields `null` — render as an unfilled form, not an error. |
| **Success State** | Toast "Profile updated," fields update in place from the response. |

#### My Dependents

| | |
|---|---|
| **Purpose** | Register family members the enrollment application covers; view/end existing relationships. |
| **Entry Point** | Citizen dashboard "My Dependents"; also linked from the Enrollment Wizard. |
| **Permissions** | `Patient` only for write actions, always own account (`SponsorPatientId` from claims). |
| **APIs** | `POST /api/insurance/dependents` (add), `GET /api/insurance/dependents/{patientId}` (list), `PATCH /api/insurance/dependents/{relationshipId}/end` (end relationship). |
| **UI Components** | Table (Name, Relationship, DOB, Active/Ended badge), "+ Add Dependent" button → form/drawer, per-row "End Relationship" action (only on active rows). |
| **Fields (Add)** | FirstName, SecondName, ThirdName, FourthName (all required, four discrete fields — not one "Full Name" box, mirrors `Patient`'s own convention), DateOfBirth (required), Gender (required, select), NationalId (optional), RelationshipType (required, select: `Spouse, Child, Parent, Guardian`). |
| **Actions** | Add Dependent; End Relationship (confirmation dialog — irreversible, a new relationship must be re-registered to undo). |
| **Validation** | DateOfBirth should reject future dates client-side (matches the same sanity check implicit in Registration). |
| **Error States** | `404` ending a relationship you don't sponsor (anti-enumeration, same non-specific pattern as everywhere else) · no DB uniqueness on duplicate relationships, so a genuine duplicate submission succeeds — don't block it client-side either. |
| **Empty State** | *"No dependents registered yet."* with the Add action prominent. |
| **Important nuance** | **No delete endpoint** — a relationship is Ended (`EndedAt` set), never removed. The `DependentPerson` record itself is untouched by Ending a relationship. |

#### My Documents

| | |
|---|---|
| **Purpose** | Upload and review identity/supporting documents for the citizen (and their dependents). |
| **Entry Point** | Citizen dashboard "My Documents"; also linked from the Enrollment Wizard's Documents step. |
| **Permissions** | `Patient` only for upload, always own account. |
| **APIs** | `POST /api/insurance/documents/upload` (`multipart/form-data`), `GET /api/insurance/documents/{patientId}` (list), `GET /api/insurance/documents/document/{documentId}` (single, resolves to the Cloudinary URL). |
| **UI Components** | Table/grid grouped by DocumentType, each row: type icon, "Current" badge (`IsCurrent`), Review Status badge, upload date, expiry (if set), "View" action; "+ Upload" opens the upload dialog (see §10). |
| **Fields (Upload)** | DocumentType (required, select — closed set of 8, see §6.3), File (required — PDF/JPG/JPEG/PNG, ≤10MB), ExpiresAt (optional date), DependentPersonId (optional — select "myself" or a specific dependent). |
| **Business rule** | Re-uploading a `DocumentType` never overwrites — it becomes the new "current" one (`IsCurrent: true`); the old row stays permanently visible as history, including any prior rejection. |
| **Review Status** | `Pending` (default, awaiting Admin review — **no review action exists yet**, see §17) / `Approved` / `Rejected` (`RejectionReason` shown when present). |
| **Error States** | `400` wrong file type/size (client-validate first, per §10) · `502` if Cloudinary is unavailable — distinct "storage unavailable" message, not a generic failure · `400` if `DependentPersonId` isn't actually sponsored by the caller. |
| **Empty State** | *"No documents uploaded yet."* with the Upload action prominent. |

#### Insurance Categories — Browse (Enrollment Wizard Step 1)

| | |
|---|---|
| **Purpose** | Let the citizen pick which insurance category to enroll under, seeing its requirements up front. |
| **Entry Point** | "Start Enrollment" from the Citizen dashboard. |
| **Permissions** | Any authenticated caller (read-only, not Patient-restricted at the API level, but only reachable from the Patient-facing wizard flow). |
| **APIs** | `GET /api/insurance/categories` (active list only — inactive categories never shown to citizens). |
| **UI Components** | Card grid, one per category: Name, Description, key eligibility facts (age range, marital-status restriction if any, guardian-required flag), required-document count, "Select" action. |
| **Fields shown per category** | `RequiredDocumentTypes` (the plain list — active + mandatory only; this is what should drive the citizen-facing document count/list, not `DocumentRequirements`, which is the richer Admin-only view — see §6.5). |
| **Empty State** | If zero categories are active (misconfiguration) — *"No insurance categories are currently available. Please check back later."* — this should never happen in practice but must not crash. |

#### Enrollment Wizard (Steps 2–5)

See §5 for the full stepper/navigation/readiness/submit specification. Screen-level notes:
- **Step: Documents** — renders one upload slot per `RequiredDocumentTypes` entry from the selected category, cross-referenced against `EnrollmentReadinessResponseDto.MissingDocumentTypes` to show which are still outstanding. Each requirement row can show `DisplayName` (falls back to a static label), `HelpText` (if set), and a link to `SampleDocumentUrl` (if set) — these ride along on the category response automatically (§6.5).
- **Step: Review & Submit** — calls `GET /api/insurance/enrollment/summary` for one aggregated payload (category, profile, dependents, documents, missing items, application status, readiness, warnings) rather than five separate calls.
- **Submit** is disabled until `EnrollmentReadinessResponseDto.IsReady === true`. If the citizen forces a submit attempt anyway (e.g., a stale client), the API rejects with `400` and a concatenated list of missing-reason strings — render these verbatim, they're already human-readable (e.g., *"Employment Letter is required."*, *"Minimum age for Government Employee is 18 (you are 16)."*).

#### My Applications

| | |
|---|---|
| **Purpose** | List every application the citizen has ever submitted (sequential over a lifetime); view one in detail; track its live status. |
| **Entry Point** | Citizen dashboard "My Applications." |
| **Permissions** | `Patient` own only / `Admin` any, via a dedicated ownership policy (no Doctor access at all to Applications). |
| **APIs** | `GET /api/insurance/applications/{patientId}` (list, newest first), `GET /api/insurance/applications/detail/{applicationId}` (full detail incl. review history), `GET /api/insurance/applications/by-number/{applicationNumber}` (human-readable lookup), `PATCH /api/insurance/applications/{applicationId}/cancel` (Patient, any non-terminal application). |
| **UI Components** | List: ApplicationNumber (e.g. `APP-2026-00000008`), Status badge, SubmittedAt, DocumentCount/DependentCount. Detail: full status timeline, review history (citizen sees `CitizenVisibleReason` only — **never** `InternalNotes`, which is Admin-only and the backend itself omits it from a Patient-caller's response), "Cancel Application" action (non-terminal only). |
| **Status values** | `Draft, Submitted, UnderReview, WaitingForDocuments, Approved, Rejected, Cancelled` — see §11 for the full badge/color/action mapping. |
| **Business rule** | A citizen can have **at most one non-terminal application at a time** (service-enforced `409` on a second `POST /api/insurance/applications`) — the wizard's "Start Enrollment" should surface this as a soft redirect to the existing application, not a raw error. |
| **Empty State** | *"No applications yet — start your enrollment to apply."* |

#### Insurance Status (aggregate tracker)

| | |
|---|---|
| **Purpose** | One citizen-facing timeline view answering "where is my enrollment right now," pulling together Application, Eligibility, Verification, and Document facts. |
| **Entry Point** | Citizen dashboard "Track My Status," or a widget on the dashboard itself. |
| **Permissions** | `Patient` own / `Admin` any (same ownership policy as Applications). |
| **APIs** | `GET /api/insurance/status/{patientId}`. |
| **UI Components** | A horizontal/vertical timeline of stages (`TimelineStageDto`: name, complete/incomplete, timestamp) — built from real, existing stages only (Submitted → Documents on file → Eligibility status → Verification status if present → Approved/Rejected). **Do not add a "Card Issued"/"Card Active" stage** — not part of this timeline's contract. |
| **Empty State** | No current application — show a neutral prompt directing to Start Enrollment, not an error. |

#### My Insurance Card

| | |
|---|---|
| **Purpose** | View every card the citizen (and their dependents) has ever held; see the current valid one; download it. |
| **Entry Point** | Citizen dashboard "My Card" — only meaningfully populated once an Admin has issued a card following an Approved application. |
| **Permissions** | `Patient` own / `Admin` any. |
| **APIs** | `GET /api/insurance/cards/{patientId}` (full history, newest first), `GET /api/insurance/cards/detail/{cardId}` (incl. status-change history), `GET /api/insurance/cards/current/{patientId}` (the one currently-valid card, `404` if none), `GET /api/insurance/cards/{cardId}/pdf` (download). |
| **UI Components** | Card visual (CardNumber, HolderFullName, IssuedAt/ExpiresAt, QR code rendered from... **not the raw `VerificationToken`** — the token is never returned in any list/detail JSON response, only usable server-side for QR/PDF generation, see §10/§13 Security note), Status badge, "Download PDF" action, history list showing superseded/revoked cards distinctly (`IsLatestCard` flag). |
| **Status values** | `Active, Suspended, Revoked, Superseded` — see §11. |
| **Empty State** | *"No insurance card issued yet. Once your application is approved, your card will appear here."* |
| **Not implemented** | Apple/Google Wallet integration, self-service renewal (Renew/Replace/Rotate are Admin-only actions) — see §17. |

### 4.2 Doctor Portal — Clinical Domain

All screens below are fully specified in `docs/ux/screens/`; this table is a navigation index with the one-line purpose and the exact source doc.

| Screen | Purpose | Full spec |
|---|---|---|
| Patient Search | Exact-match lookup by 14-digit National ID — the only entry point into a chart | `docs/ux/screens/patient-search.md` |
| Patient Medical Summary | First screen after selecting a patient — latest visit's diagnosis/notes/tests/meds/attachments in one view | `docs/ux/screens/patient-medical-summary.md` |
| Patient Visit History | Full chronological visit list, lightweight rows | `docs/ux/screens/patient-visit-history.md` |
| Visit Detail | Full single-encounter record | `docs/ux/screens/visit-detail.md` |
| New Visit / Create Encounter | Open a new clinical encounter, optional inline medications | `docs/ux/screens/new-visit-create-encounter.md` |
| Edit Clinical Note | Full replace of Diagnosis/Notes/RequiredTests | `docs/ux/screens/edit-clinical-note.md` |
| Update Visit Status | State-machine transition dialog | `docs/ux/screens/update-visit-status-dialog.md` |
| Add Medications | Append medication line items to an open visit | `docs/ux/screens/add-medications-panel.md` |
| Printable Prescription | Print-ready medications view, no backing API | `docs/ux/screens/printable-prescription-view.md` |
| Visit Attachments Panel | Files tied to one encounter | `docs/ux/screens/visit-attachments-panel.md` |
| Upload Attachment | Single-file upload to a visit | `docs/ux/screens/upload-attachment-dialog.md` |
| Attachment Viewer | Open/preview a single file | `docs/ux/screens/attachment-viewer.md` |
| My Patients | Doctor's own roster (assigned ∪ visit-derived) | `docs/ux/screens/my-patients.md` |

**Two Insurance actions also belong to the Doctor Portal** (point-of-care, not Admin):
- **Verify Insurance** — `POST /api/insurance/verification/verify` (`Doctor, Admin`). A lightweight action (likely a small form/dialog reachable from a patient context): PatientId, Status (`Verified/NotVerified/Pending`), Context (`Appointment/CheckIn/ClinicVisit/EmergencyAdmission/Billing`), Reason, optional Remarks.
- **Verify Card** — `POST /api/insurance/cards/verify` (`Doctor, Admin`). Body: `VerificationToken` (scanned from a QR). Returns the minimal `CardVerificationResultDto` (`CardNumber, HolderFullName, IsCurrentlyValid, ExpiresAt, Status`) — deliberately no `NationalId`/`Address`/`Mobile`; identity confirmation is expected via the physical card + a separately-presented government ID, not this API.

### 4.3 Admin Portal

#### Clinical Admin

Fully specified in `docs/ux/screens/`: Assign Patient to Doctor (`assign-patient-to-doctor-dialog.md`), Remove Assignment (`remove-assignment-dialog.md`), Audit Log Explorer (`audit-log-explorer.md`). Audit Log Detail and Chain Integrity Verification and Audit Dashboard are described in `docs/ux/02-screen-inventory.md` Module 6 (no individual screen doc file exists yet for these three — build from that module's spec).

#### Insurance Categories (Admin)

| | |
|---|---|
| **Purpose** | Configure the reference data the citizen-facing wizard reads from — General info, Eligibility Rule, Required Documents — without a code deploy. |
| **Entry Point** | Admin sidebar "Insurance → Categories." |
| **Permissions** | `Admin` only for every write; reads are open to any authenticated caller (but this screen itself is Admin-only navigation). |
| **UI Components** | Category List (`GET /api/insurance/categories/all` — includes inactive) → Category Detail, **four tabs**: |

**Tab 1 — General**
- APIs: `PUT /api/insurance/categories/{id}` (also `POST /api/insurance/categories` for create).
- Fields: Code (text, unique, stable machine key e.g. `GOVERNMENT_EMPLOYEE`, never shown to citizens), Name (text), Description (text, optional), IsActive (toggle — soft-disable only, never hard-deleted), DisplayOrder (number).
- Errors: `409` if Code is already taken by another category.

**Tab 2 — Eligibility Rules**
- API: `PUT /api/insurance/categories/{id}/eligibility-rule` (full replace/upsert).
- Fields: MinimumAge (number, optional), MaximumAge (number, optional, must be ≥ MinimumAge — `400` otherwise), AllowedMaritalStatuses (multi-select, empty = no restriction), GuardianRequired (toggle — **informational only**, not enforced automatically; surfaced to Admin as a manual-review note, never blocks a citizen), DependentsAllowed (toggle).

**Tab 3 — Required Documents**
- APIs: `GET /api/insurance/categories/{id}/requirements` (list all, incl. inactive), `POST .../requirements` (add one), `PUT .../requirements/{requirementId}` (update one), `DELETE .../requirements/{requirementId}` (remove one). The older `PUT .../requirements` (bulk full-replace of just DocumentTypes) still exists for compatibility but the granular actions are what this screen should use.
- Per-row fields: DocumentType (fixed once added — select from the closed 8-value enum, remove+re-add to change), Display Name (text, optional, falls back to a static label), Help Text (text, optional, shown to citizen next to the upload field), Sample Document URL (URL, optional), Required/Optional toggle (`IsMandatory`), Active/Inactive toggle (`IsActive`), Display Order (number, drag-reorder).
- Row actions: toggle Active/Optional inline (instant `PUT`), remove (instant `DELETE`), "+ Add Document" (dropdown of DocumentType values not already on this category).
- Errors: `409` adding a DocumentType that already exists on the category (active or inactive) — the fix is to re-enable the existing row via `PUT`, not re-add.

**Tab 4 — Preview** *(read-only, no API of its own)*
- Reuses `GET /api/insurance/categories/{id}` — the exact same response the citizen wizard reads.
- Renders: Eligibility Summary (Name, Min/Max Age, Allowed Marital Statuses, Guardian Required, Dependents Allowed — straight passthrough) + Required Documents (`documentRequirements` filtered to `isActive === true`, sorted by `displayOrder`, each showing DisplayName/HelpText-if-present/SampleDocumentUrl-if-present/Required-or-Optional badge).
- No Save button, no Edit capability, no validation — purely a mirror of what the citizen will see.

#### Application Review (Admin)

| | |
|---|---|
| **Purpose** | Review and decide on submitted insurance applications. |
| **Entry Point** | Admin sidebar "Insurance → Applications." |
| **Permissions** | `Admin` only for review; list/detail via the same ownership policy Patient uses for their own (Admin sees any). |
| **APIs** | `GET /api/insurance/applications/{patientId}` per-patient, or iterate via known application numbers — **there is no "list all applications across all patients" endpoint**; design the Admin queue around whatever entry point surfaces a patientId first (e.g., from Audit Log or a citizen support request) — flag this as a real gap if a true cross-patient review queue is needed (§17). `PATCH /api/insurance/applications/{applicationId}/review` is the core action. |
| **Fields (Review action)** | NewStatus (required, must be a valid transition from the current status — see §11 for the state machine), CitizenVisibleReason (optional, shown to the citizen), InternalNotes (optional, Admin-only, never shown to the citizen). |
| **Business rule** | `DecisionReason`-equivalent (`CitizenVisibleReason`) must be non-empty by the time `NewStatus` is `Approved` or `Rejected` — enforced server-side, not just DTO-required (since the same request shape is reused for intermediate transitions like `UnderReview`/`WaitingForDocuments` where a reason isn't mandatory). Validate this client-side too before submit. |
| **Error States** | `409` if the requested transition isn't valid from the current status (see §11's state machine) — surface the actual reason, not a generic conflict message. |

#### Card Lifecycle (Admin)

| | |
|---|---|
| **Purpose** | Issue cards for approved applications; manage their lifecycle. |
| **Entry Point** | From an Approved Application's detail screen ("Issue Card" action), or Admin sidebar "Insurance → Cards." |
| **Permissions** | `Admin` only for every mutation. |
| **APIs & Actions** | `POST /api/insurance/cards/issue/{applicationId}` (issues one card for the applicant + one per dependent on that application, atomically; `409` if the application isn't `Approved` or the scope already has a non-terminal card) · `PATCH .../{cardId}/suspend` (Reason required) · `PATCH .../{cardId}/reactivate` (no body) · `PATCH .../{cardId}/revoke` (Reason required, terminal) · `POST .../{cardId}/renew` (predecessor must be `Active`; Reason optional; fresh expiry) · `POST .../{cardId}/replace` (predecessor `Active` or `Suspended`; `ReplacementReason` **required**: `Lost/Damaged/Stolen/Other` + optional `ReasonNote`; expiry carries forward from predecessor if still future, otherwise fresh) · `PATCH .../{cardId}/rotate-token` (no body, no status change — only for a suspected-compromised QR image). |
| **UI Components** | Card detail with a lifecycle action bar (buttons enabled/disabled per current `Status` — see §11's allowed-actions column), status-change history list, lineage chain (`PredecessorCardId`/`SuccessorCardId`) shown as a simple "renewed from / renewed to" link when present. |
| **Business rule** | Every one of these actions **only reads** `InsuranceApplication.Status` for Issue — it never writes back to the Application. Revocation is one-way: the only path forward for a revoked card is a brand-new Approved Application. |

---

## 5. Wizard Specifications

**The Enrollment Wizard is the only true multi-step wizard in the system.** Nothing in the Clinical domain is wizard-shaped (Create Visit is a single-page form with an optional repeating group, not a wizard — see `docs/ux/screens/new-visit-create-encounter.md` §12 for why a wizard was explicitly rejected there).

### Enrollment Wizard

| Step | Screen | Backing API | Gate to proceed |
|---|---|---|---|
| 1 | Category Browse & Select | `GET /api/insurance/categories`, then `POST /api/insurance/enrollment/start` | A category must be selected. Starting is blocked with `409` if the citizen already has a non-terminal enrollment — redirect into the existing one instead of erroring. |
| 2 | Profile Check | `GET /api/profile` (reused) | If `ProfileComplete` (from readiness, see below) is false, this step is shown; otherwise it's skipped entirely, not shown-and-passed. |
| 3 | Dependents (optional) | `GET/POST /api/insurance/dependents` (reused) | Never blocking — dependents are optional; "Skip" is always available. |
| 4 | Documents | `GET /api/insurance/documents/{patientId}`, `POST /api/insurance/documents/upload` (reused) | Not a hard gate at the step level — the wizard lets the citizen move on and come back; the **real** gate is at Submit (see below). |
| 5 | Review & Submit | `GET /api/insurance/enrollment/summary` | Submit button enabled only when `readiness.isReady === true`. |

**Stepper**: linear, 5 positions, all previously-visited steps remain navigable backward (no data is lost by going back — every step's data is already persisted server-side the moment it's entered, there is no wizard-local draft state to lose).

**Navigation rules**:
- **Previous**: always enabled except on Step 1.
- **Next**: enabled unconditionally on Steps 1–4 (none of them block forward navigation — see the Documents step note above); the wizard's role is to guide, not gate, until the final Submit.
- **Skip**: available on Step 3 (Dependents) only — it's the one genuinely optional step. Steps 2 and 4 are not "skippable" exactly; Step 2 auto-skips when already complete, and Step 4 is always visitable since more documents can always be added.
- **Progress**: a 5-segment indicator; segments for Steps 2–4 can show a checkmark once their respective readiness sub-flag (`profileComplete`, n/a for dependents, `documentsComplete`) is true, giving the citizen a running sense of completion without blocking navigation.

**Validation**: each step validates its own form inputs locally (see §6); there is no cross-step validation beyond what Readiness (below) already aggregates.

**Readiness**: `GET /api/insurance/enrollment/readiness` is the single source of truth for "can this be submitted" — it is also invoked internally by the direct `PATCH /api/insurance/applications/{id}/submit` endpoint, so the wizard's gating and any other submission path enforce **identical rules**. Response shape (`EnrollmentReadinessResponseDto`):

| Field | Meaning |
|---|---|
| `isReady` | The single flag that gates Submit. |
| `missingRequirements` | Human-readable list — render directly as a bullet list of what's still needed. |
| `missingDocumentTypes` | Machine-readable subset — the specific DocumentTypes not yet uploaded. |
| `isEligibleForCategory` | False if age/marital-status/dependents violate the category's eligibility rule. |
| `eligibilityViolations` | The eligibility-specific subset of `missingRequirements`. |
| `profileComplete` | False if Occupation/MaritalStatus/Nationality/EmergencyContact fields are missing. |
| `dependentsValid` | Effectively always true in normal use — a structural-integrity check. |
| `documentsComplete` | False if any active+mandatory document type hasn't been uploaded. |
| `applicationExists` | False if there's no active application/enrollment to check at all. |

**Submit**: `PATCH /api/insurance/enrollment/submit` (wizard path) or `PATCH /api/insurance/applications/{applicationId}/submit` (direct path, e.g. from the Applications list on a Draft) — both enforce the identical readiness check server-side. A submit attempt while not ready returns `400` with the same missing-reason strings readiness already showed; never let the button be clickable in that state, but handle the response gracefully anyway (a stale client is possible).

---

## 6. Form Specifications

### 6.1 Registration (`POST /api/auth/register`)

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| NationalId | text (numeric) | Yes | Exactly 14 digits, regex `^\d{14}$` | Live-validate once 14 digits reached |
| FirstName / SecondName / ThirdName / FourthName | text | Yes (all four) | Max 50 chars each | Four discrete fields — never merge into one "Full Name" box |
| DateOfBirth | date | Yes | — | Default the picker to a reasonable adult year |
| Gender | select | Yes | Matches backend `Gender` enum | |
| MobileNumber | text | Yes | Phone format | |
| Governorate | select | Yes | Max 100 chars | |
| District | select | Yes | Max 100 chars | Narrows based on Governorate if the app maintains a client-side list |
| Email | text | No | Valid email format if present | |
| Address | text | Yes | Max 300 chars | |
| Username | text | Yes | Max 50 chars | |
| Password | password | Yes | ≥8 chars, ≥1 letter, ≥1 digit, ≥1 special character | Show a live checklist while typing |

Full field/UX rationale: `docs/ux/screens/patient-self-registration.md`.

### 6.2 Profile (`PUT /api/profile`)

| Field | Type | Required | Editable | Notes |
|---|---|---|---|---|
| Occupation | text | Effectively required for readiness | Yes | Missing → `profileComplete: false` |
| MaritalStatus | select | Effectively required | Yes | Reused directly by category Eligibility Rules |
| Nationality | text | Effectively required | Yes | |
| EmergencyContactName | text | Effectively required | Yes | |
| EmergencyContactPhone | text | Effectively required | Yes | |

Full replace — a `PUT` that omits a field clears it. No field is individually optional at the API level, but none is DTO-`[Required]` either; "required" here means "required for enrollment readiness," enforced by the readiness check, not by profile-save validation itself.

### 6.3 Document Upload (`POST /api/insurance/documents/upload`, multipart)

| Field | Type | Required | Notes |
|---|---|---|---|
| DocumentType | select | Yes | Closed set: `NationalId, BirthCertificate, MarriageCertificate, EmploymentLetter, DisabilityCertificate, DeathCertificate, GuardianAuthorization, FamilyRegistration` — no "Other," no free text |
| File | file picker | Yes | PDF/JPG/JPEG/PNG only, ≤10MB — validate client-side before upload starts |
| ExpiresAt | date | No | e.g. a National ID's printed expiry |
| DependentPersonId | select | No | "Myself" or a specific registered dependent |

### 6.4 Add Dependent (`POST /api/insurance/dependents`)

| Field | Type | Required | Notes |
|---|---|---|---|
| FirstName / SecondName / ThirdName / FourthName | text | Yes (all four) | Same four-part convention as Registration |
| DateOfBirth | date | Yes | Reject future dates client-side |
| Gender | select | Yes | |
| NationalId | text | No | A dependent may not have one yet |
| RelationshipType | select | Yes | `Spouse, Child, Parent, Guardian` — closed set |

### 6.5 Insurance Category — General (`POST`/`PUT /api/insurance/categories`)

| Field | Type | Required | Notes |
|---|---|---|---|
| Code | text | Yes | Unique; stable machine key, never shown to citizens |
| Name | text | Yes | Shown to citizens |
| Description | text | No | |
| IsActive | toggle | — | Default true |
| DisplayOrder | number | — | |

### 6.6 Insurance Category — Eligibility Rule (`PUT .../eligibility-rule`)

| Field | Type | Required | Notes |
|---|---|---|---|
| MinimumAge | number | No | Null = no minimum |
| MaximumAge | number | No | Must be ≥ MinimumAge |
| AllowedMaritalStatuses | multi-select | No | Empty = no restriction |
| GuardianRequired | toggle | — | Informational only, not enforced |
| DependentsAllowed | toggle | — | Default true |

### 6.7 Insurance Category — Document Requirement (`POST`/`PUT .../requirements[/{id}]`)

| Field | Type | Required | Editable | Dynamic Visibility |
|---|---|---|---|---|
| DocumentType | select | Yes (Add only) | No (Update) | Hidden/fixed on the Update form — immutable post-creation |
| DisplayName | text | No | Yes | |
| HelpText | text | No | Yes | |
| SampleDocumentUrl | URL | No | Yes | Must be a well-formed absolute URL |
| DisplayOrder | number | No | Yes | |
| IsActive | toggle | — | Yes (Update only) | Not present on Add (new rows are always active) |
| IsMandatory | toggle | — | Yes | Default true |

### 6.8 New Visit (`POST /api/visits`)

Full field/layout spec: `docs/ux/screens/new-visit-create-encounter.md`. Summary:

| Field | Type | Required | Notes |
|---|---|---|---|
| VisitDate | date | Yes | Defaults to today |
| VisitType | select | Yes | `Consultation, FollowUp, Emergency` |
| DoctorId | fixed/lookup | Yes | Pre-filled/disabled for a Doctor caller; real lookup for Admin |
| Diagnosis / Notes / RequiredTests | textarea | No | Optional at creation — usually filled in later |
| Medications (repeating) | group | No | All-or-nothing per row: MedicineName, Dosage, Frequency, Duration all required together if any is filled |

### 6.9 Update Visit Status (`PATCH /api/visits/{id}/status`)

| Field | Type | Required | Dynamic Visibility |
|---|---|---|---|
| Status | select (only valid next-states shown) | Yes | Options depend on current status: from `Scheduled` → `InProgress`/`Cancelled`; from `InProgress` → `Completed` only; `Completed`/`Cancelled` offer no further transition |

---

## 7. API Integration

Every route in the system, grouped by module. `Role` is the `[Authorize]` constraint; ownership/anti-enumeration nuances are in §9. **Caching recommendation** and **retry strategy** columns apply the same pattern throughout unless noted: GETs are safely cacheable per-key with invalidation on the corresponding mutation; mutations are never auto-retried (no idempotency key exists anywhere in this API — a retried POST could double-submit).

### 7.1 Auth

| Endpoint | Method | Role | Request | Response | Notes |
|---|---|---|---|---|---|
| `/api/auth/register` | POST | anon | `RegisterRequestDto` | `AuthResponseDto` (token+expiry+user) | `409` on duplicate NationalId/Username |
| `/api/auth/login` | POST | anon | `LoginRequestDto` | `AuthResponseDto` | `401` generic message, both causes |
| `/api/auth/me` | GET | any | — | `MeResponseDto` | Drives the top-nav identity chip |

**Loading**: button-level spinner, no page overlay. **Error handling**: per §12. **Retry**: never auto-retry login/register (could double-submit registration). **Caching**: `me` cacheable for the session, invalidate on logout.

### 7.2 Profile

| Endpoint | Method | Role | Request | Response |
|---|---|---|---|---|
| `/api/profile` | GET | Patient | — | `ProfileResponseDto` |
| `/api/profile` | PUT | Patient | `UpdateProfileRequestDto` (full replace) | `ProfileResponseDto` |

### 7.3 Dependents

| Endpoint | Method | Role | Request | Response |
|---|---|---|---|---|
| `/api/insurance/dependents` | POST | Patient | `AddDependentRequestDto` | `DependentResponseDto` |
| `/api/insurance/dependents/{patientId}` | GET | Patient(own)/Doctor/Admin | — | `List<DependentResponseDto>` |
| `/api/insurance/dependents/{relationshipId}/end` | PATCH | Patient | — | `DependentResponseDto` |

### 7.4 Documents

| Endpoint | Method | Role | Request | Response |
|---|---|---|---|---|
| `/api/insurance/documents/upload` | POST | Patient | multipart (§6.3) | `CitizenDocumentResponseDto` |
| `/api/insurance/documents/{patientId}` | GET | Patient(own)/Doctor/Admin | — | `List<CitizenDocumentResponseDto>` |
| `/api/insurance/documents/document/{documentId}` | GET | same policy | — | `CitizenDocumentResponseDto` |

**Retry**: upload is safe to let the user retry manually on `502`, never auto-retry silently (see §10).

### 7.5 Insurance Categories

| Endpoint | Method | Role | Request | Response |
|---|---|---|---|---|
| `/api/insurance/categories` | GET | any | — | `List<InsuranceCategoryResponseDto>` (active only) |
| `/api/insurance/categories/all` | GET | Admin | — | `List<InsuranceCategoryResponseDto>` (incl. inactive) |
| `/api/insurance/categories/{id}` | GET | any | — | `InsuranceCategoryResponseDto` |
| `/api/insurance/categories` | POST | Admin | `InsuranceCategoryRequestDto` | `InsuranceCategoryResponseDto` |
| `/api/insurance/categories/{id}` | PUT | Admin | `InsuranceCategoryRequestDto` | `InsuranceCategoryResponseDto` |
| `/api/insurance/categories/{id}/requirements` | PUT | Admin | `SetCategoryDocumentRequirementsRequestDto` (bulk) | `InsuranceCategoryResponseDto` |
| `/api/insurance/categories/{id}/eligibility-rule` | PUT | Admin | `SetCategoryEligibilityRuleRequestDto` | `InsuranceCategoryResponseDto` |
| `/api/insurance/categories/{id}/requirements` | GET | Admin | — | `List<CategoryDocumentRequirementDto>` |
| `/api/insurance/categories/{id}/requirements` | POST | Admin | `AddCategoryDocumentRequirementRequestDto` | `CategoryDocumentRequirementDto` |
| `/api/insurance/categories/{id}/requirements/{requirementId}` | PUT | Admin | `UpdateCategoryDocumentRequirementRequestDto` | `CategoryDocumentRequirementDto` |
| `/api/insurance/categories/{id}/requirements/{requirementId}` | DELETE | Admin | — | `204 No Content` |

**Caching**: `GET /categories` (active list) is read constantly by the wizard — cache aggressively, invalidate on any Admin category mutation.

### 7.6 Enrollment

| Endpoint | Method | Role | Request | Response |
|---|---|---|---|---|
| `/api/insurance/enrollment/start` | POST | Patient | `StartEnrollmentRequestDto` | `EnrollmentResponseDto` |
| `/api/insurance/enrollment/current` | GET | Patient | — | `EnrollmentResponseDto` |
| `/api/insurance/enrollment/readiness` | GET | Patient | — | `EnrollmentReadinessResponseDto` |
| `/api/insurance/enrollment/summary` | GET | Patient | — | `EnrollmentSummaryResponseDto` |
| `/api/insurance/enrollment/submit` | PATCH | Patient | — | `EnrollmentResponseDto` |

**Caching**: never cache `readiness` — it must reflect live state after every document upload/profile edit within the wizard session.

### 7.7 Applications

| Endpoint | Method | Role | Request | Response |
|---|---|---|---|---|
| `/api/insurance/applications` | POST | Patient | — (no body) | `ApplicationResponseDto` |
| `/api/insurance/applications/{applicationId}/submit` | PATCH | Patient | — | `ApplicationResponseDto` |
| `/api/insurance/applications/{applicationId}/cancel` | PATCH | Patient | — | `ApplicationResponseDto` |
| `/api/insurance/applications/{applicationId}/review` | PATCH | Admin | `ReviewApplicationRequestDto` | `ApplicationResponseDto` |
| `/api/insurance/applications/{patientId}` | GET | Patient(own)/Admin | — | `List<ApplicationResponseDto>` |
| `/api/insurance/applications/detail/{applicationId}` | GET | Patient(own)/Admin | — | `ApplicationDetailResponseDto` |
| `/api/insurance/applications/by-number/{applicationNumber}` | GET | Patient(own)/Admin | — | `ApplicationDetailResponseDto` |

### 7.8 Eligibility

| Endpoint | Method | Role | Request | Response |
|---|---|---|---|---|
| `/api/insurance/eligibility/check` | POST | Admin | `CheckEligibilityRequestDto` | `InsuranceEligibilityResponseDto` |
| `/api/insurance/eligibility/{patientId}` | GET | Patient(own)/Doctor/Admin | — | `InsuranceEligibilityResponseDto` |

`GET` for a patient with no record yet is a **normal, expected `404`** ("nobody has checked them yet") — do not treat as an error state.

### 7.9 Verification

| Endpoint | Method | Role | Request | Response |
|---|---|---|---|---|
| `/api/insurance/verification/verify` | POST | Doctor, Admin | `VerifyInsuranceRequestDto` | `InsuranceVerificationResponseDto` |
| `/api/insurance/verification/{patientId}/latest` | GET | Patient(own)/Doctor/Admin | — | `InsuranceVerificationResponseDto` |
| `/api/insurance/verification/current/{patientId}` | GET | same | — | `InsuranceVerificationResponseDto` (only if `IsCurrentlyValid`, else `404`) |
| `/api/insurance/verification/{patientId}/history` | GET | same | — | `List<InsuranceVerificationResponseDto>` |

### 7.10 Status

| Endpoint | Method | Role | Request | Response |
|---|---|---|---|---|
| `/api/insurance/status/{patientId}` | GET | Patient(own)/Admin | — | `InsuranceStatusResponseDto` |

### 7.11 Digital Insurance Cards

| Endpoint | Method | Role | Request | Response |
|---|---|---|---|---|
| `/api/insurance/cards/issue/{applicationId}` | POST | Admin | — | `List<CardResponseDto>` |
| `/api/insurance/cards/{cardId}/suspend` | PATCH | Admin | `ChangeCardStatusRequestDto` (Reason required) | `CardResponseDto` |
| `/api/insurance/cards/{cardId}/reactivate` | PATCH | Admin | — | `CardResponseDto` |
| `/api/insurance/cards/{cardId}/revoke` | PATCH | Admin | `ChangeCardStatusRequestDto` (Reason required) | `CardResponseDto` |
| `/api/insurance/cards/{cardId}/renew` | POST | Admin | `ChangeCardStatusRequestDto` (Reason optional) | `CardResponseDto` |
| `/api/insurance/cards/{cardId}/replace` | POST | Admin | `ReplaceCardRequestDto` (ReplacementReason required) | `CardResponseDto` |
| `/api/insurance/cards/{cardId}/rotate-token` | PATCH | Admin | — | `CardResponseDto` |
| `/api/insurance/cards/verify` | POST | Doctor, Admin | `VerifyCardRequestDto` | `CardVerificationResultDto` |
| `/api/insurance/cards/{patientId}` | GET | Patient(own)/Admin | — | `List<CardResponseDto>` |
| `/api/insurance/cards/detail/{cardId}` | GET | Patient(own)/Admin | — | `CardDetailResponseDto` |
| `/api/insurance/cards/current/{patientId}` | GET | Patient(own)/Admin | — | `CardResponseDto` (`404` if none) |
| `/api/insurance/cards/{cardId}/pdf` | GET | Patient(own)/Admin | — | rendered file |

### 7.12 Clinical Domain

| Endpoint | Method | Role | Notes |
|---|---|---|---|
| `/api/patients/search?nationalId=` | GET | Doctor, Admin | Exact match only, no partial/typeahead |
| `/api/patients/{patientId}/medical-summary` | GET | ownership-checked | Latest visit only |
| `/api/patients/{patientId}/visit-history` | GET | ownership-checked | Full chronological, truncated diagnosis |
| `/api/visits` | POST | Doctor, Admin | With optional inline medications |
| `/api/visits/{id}` | GET | ownership-checked | |
| `/api/visits/{id}` | PUT | Doctor (owner only) | Full replace of Diagnosis/Notes/RequiredTests |
| `/api/visits/{id}/status` | PATCH | Doctor, Admin | State machine, see §11 |
| `/api/visits/{id}/medications` | POST | Doctor (owner, open visit) | `409` if visit is Completed/Cancelled |
| `/api/visits/{visitId}/attachments` | POST | Doctor (owner) | multipart, PDF/JPG/JPEG/PNG ≤10MB |
| `/api/visits/{visitId}/attachments` | GET | ownership-checked | |
| `/api/attachments/{id}` | GET | ownership-checked | |
| `/api/doctors/{doctorId}/patients/{patientId}` | POST | Admin | Assign, `409` if already assigned |
| `/api/doctors/{doctorId}/patients` | GET | Doctor(own)/Admin | Assigned ∪ visit-derived |
| `/api/doctors/{doctorId}/patients/{patientId}` | DELETE | Admin | Removes assignment row only — does not revoke visit-derived access |
| `/api/audit` | GET | Admin | The only paginated endpoint in the system (`Page`/`PageSize`, max 200) |
| `/api/audit/{id}` | GET | Admin | |
| `/api/audit/verify` | GET | Admin | Walks full chain, can take real time |
| `/api/audit/dashboard` | GET | Admin | |

Full auth-flow/JWT/claims detail: not repeated here (backend concern) — the one frontend-relevant fact is **there is no refresh token, no logout/revocation endpoint, and no "remember me."** A token is valid until its embedded expiry (default 7 days) full stop; client-side logout is just discarding the token.

---

## 8. UI Components Library

| Component | Used by | Key behavior |
|---|---|---|
| **Data Table** | Audit Log (only real server pagination+sort), Visit History, My Patients, Dependents, Documents, Applications list, Cards list | 36px dense rows default; entire row is the click target; sort/pagination chrome only where the backend actually supports it (Audit Log only — see §7.12) |
| **Upload Component** | Document Upload, Attachment Upload | Drag-and-drop + browse fallback, constraints stated upfront, real percentage progress (not indeterminate) — see §10 |
| **Document Card** | My Documents, Enrollment Wizard Step 4 | Type icon, Current badge, Review Status badge, expiry if set |
| **Insurance Card (visual)** | My Insurance Card | CardNumber, HolderFullName, IssuedAt/ExpiresAt, QR (server-rendered, never the raw client-side token), Status badge |
| **Appointment Card** | **Not applicable — no Appointments concept exists** (§17) |
| **Doctor Card** | My Patients roster row / Assign dialog | Name, National ID (Patient Search only), Relationship indicator |
| **Medical Timeline** | Visit History, Insurance Status | Date-ordered list, not a decorative connected-line visualization — see `docs/ux/screens/patient-visit-history.md` §11 for why |
| **Queue Card** | **Not applicable — no queue/appointment concept exists** |
| **Status Badge** | Every status enum in §11 | Always icon + text, never color alone |
| **Search Bar** | Patient Search only | Exact 14-digit National ID input with live digit counter — never a generic/typeahead search box (no backend support) |
| **Filters** | Audit Log Explorer only | The only screen with real server-side filtering; AND-combined, active-count badge, one-click clear |
| **Date Picker** | Registration DOB, Add Dependent DOB, Document ExpiresAt, New Visit VisitDate | |
| **Notification Banner** | Page-level constraint banners (closed visit, storage unavailable), form validation summaries | Inline, not toast — reserved for state tied to the current screen |
| **Modal** | Confirmations, small bounded forms (Assign Patient, Upload Attachment, Update Visit Status) | Never for multi-section or optional-repeating-group forms (Create Visit) |
| **Confirmation Dialog** | Cancel Visit, Update to terminal Visit status, Remove Assignment, Cancel Application, End Dependent Relationship | Friction proportional to reversibility — see design-system.md §1 |
| **Wizard Step** | Enrollment Wizard only | See §5 |
| **Progress Indicator** | Enrollment Wizard stepper, Upload progress bar, Audit chain verification (indeterminate) | |
| **Toast** | Ephemeral session-local action confirmations only ("Profile updated," "Document uploaded") | Auto-dismiss ~4s, never a substitute for a real notification system — none exists (§17) |

Visual language (color palette, type scale, spacing, elevation, icon set, grid) is defined once in `docs/ux/01-design-system.md` and applies to **both** domains — do not create a second design language for Insurance screens. See §15.

---

## 9. Business Rules

UI-relevant only — backend enforcement mechanics are not described.

**Enrollment / Submit**
- Submit is enabled only when `readiness.isReady === true` — every one of `profileComplete`, `dependentsValid`, `documentsComplete`, `isEligibleForCategory`, `applicationExists` must hold.
- A missing/incomplete profile field makes `profileComplete: false`; the wizard should route back to Step 2 rather than just disabling Submit silently.
- A document becomes "required" in `RequiredDocumentTypes` only if it's both `IsActive` and `IsMandatory` on the category — an Optional document never blocks readiness and has no dedicated UI surface in the wizard today (§17).
- A citizen with any active dependent cannot submit under a category with `DependentsAllowed: false` — surfaced as an eligibility violation string, not a silent block.
- `GuardianRequired` on a category is **never** enforced automatically — it's a manual-review note for Admin, never a citizen-facing block.

**Applications**
- At most one non-terminal application per citizen at a time (`409` on a second create/start attempt).
- `Draft, Submitted, UnderReview, WaitingForDocuments` are non-terminal; `Approved, Rejected, Cancelled` are terminal — no further transition, no "reopen." A rejected citizen submits a brand-new application.
- Citizens never see `InternalNotes` on a review entry — only `CitizenVisibleReason`. This is enforced by the backend response shape itself (the field is simply absent/null for a Patient caller), not something the frontend needs to filter.

**Documents**
- Re-uploading a `DocumentType` never overwrites — always creates a new "current" row; history stays visible.
- A document can be `Pending`/`Approved`/`Rejected`, but **no Admin review action exists yet** to actually change that status (§17) — every document effectively stays `Pending` today. Don't build an Admin "approve/reject a document" screen against a nonexistent endpoint.

**Visits (Clinical)**
- Status machine: `Scheduled → InProgress → Completed`, or `Scheduled → Cancelled`. No other transition, ever (including re-applying the same status).
- Medications cannot be added once a visit is `Completed`/`Cancelled` — show this as a page-level banner before the user tries, not just a failed-submit error.
- `PUT /api/visits/{id}` (Edit Clinical Note) is a **full replace** — clearing a previously-filled field to blank genuinely deletes that content; warn before saving an emptied previously-populated field.
- Only the treating Doctor (visit owner) can edit clinical content or add medications/attachments — Admin's view is structurally read-only, never a disabled-button state.

**Cards**
- Issue only succeeds against an `Approved` application, and only when the target scope has no existing non-terminal card.
- Renew requires the card to currently be `Active`; Replace accepts `Active` **or** `Suspended` (stricter vs. looser gate, by design).
- Revocation is permanent and cannot be bypassed by Renew/Replace/Rotate — all three reject a `Revoked` predecessor.
- Rotate Token changes only the QR's embedded secret — `CardNumber`, `Status`, and `ExpiresAt` never change; it produces no status-history entry (it isn't a status transition).

**Cross-cutting**
- A `404` from any patient-scoped Clinical endpoint means "doesn't exist" **or** "exists but you can't see it" — always render the identical message; never try to distinguish the two causes.
- A `403` (e.g., a Doctor hitting an Admin-only route) is a plain, statable fact ("This area is restricted to Administrators") — safe to be specific here, unlike the 404 case above.

---

## 10. File Upload UX

Two upload surfaces exist, both with identical constraints (they share the same backend validation helper):

| | Insurance Documents | Clinical Attachments |
|---|---|---|
| **Allowed Extensions** | `.pdf, .jpg, .jpeg, .png` | Same |
| **Content-Type check** | `application/pdf, image/jpeg, image/png` (both extension AND content-type must pass) | Same |
| **Maximum Size** | 10 MB | 10 MB |
| **Who can upload** | Patient, own documents/dependents only | Doctor only, own open visit only |
| **Preview** | Type icon + filename before upload; existing rows show type icon + Current/Review-Status badges | Type icon + filename; image lightbox / native-tab PDF viewer after upload (`docs/ux/screens/attachment-viewer.md`) |
| **Replace** | Re-upload the same DocumentType — creates a new "current" row, old one stays as history (never a true in-place replace) | No replace concept — attachments are append-only |
| **Delete** | **No delete endpoint exists for either surface.** Do not design a delete affordance for a document or attachment anywhere. |
| **Progress** | Real percentage bar, not an indeterminate spinner — files can be up to 10MB | Same |
| **Retry** | Manual retry only, user-initiated — never auto-retry a failed upload | Same |
| **Failure — wrong type/size** | Caught client-side before any network call: *"This file type isn't supported"* / *"File exceeds the 10MB limit"* | Same |
| **Failure — storage unavailable (`502`)** | Distinct message: *"Attachment storage is temporarily unavailable. Try again in a moment."* — never conflate with a rejected-file message | Same (this is the Cloudinary dependency both surfaces share) |
| **Failure — orphan cleanup** | If the Cloudinary upload succeeds but the DB write fails, the backend deletes the orphaned file — from the UI's perspective this is just a normal failed-upload retry, safe to resubmit the same file | Same |
| **Success** | New row appears in the list/table immediately from the response, no need to refetch | Same |

---

## 11. Status Mapping

Color/icon conventions extend `docs/ux/01-design-system.md` §2's four semantic tokens (`success #0E7C3A`, `warning #B5760B`, `danger #C4314B`, `info #0F6CBD`) plus its muted-administrative tone (`#8E5B5B`, used for `Cancelled`-type end-states that aren't failures) — no new palette is introduced for the Insurance domain's additional enums.

### VisitStatus (already defined in design-system.md §2 — repeated for completeness)

| Status | Color | Icon | Allowed Actions | Disabled Actions |
|---|---|---|---|---|
| Scheduled | Neutral-blue `#4F6BED` | Calendar | Start (→InProgress), Cancel, Edit, Add Medication, Upload | — |
| InProgress | Amber `#B5760B` | Half-filled circle | Complete, Edit, Add Medication, Upload | Cancel* |
| Completed | Green `#0E7C3A` | Check circle | View only | Edit, Add Medication, Status change |
| Cancelled | Muted red-gray `#8E5B5B` | Slash circle | View only | Edit, Add Medication, Status change |

*`InProgress → Cancelled` is not in `AllowedTransitions` — only `Scheduled → Cancelled` is valid.

### ApplicationStatus

| Status | Color | Icon | Allowed Actions (Patient) | Allowed Actions (Admin) |
|---|---|---|---|---|
| Draft | Neutral gray | Pencil | Submit, Cancel | — |
| Submitted | Info blue `#0F6CBD` | Paper-plane | Cancel | Move to UnderReview |
| UnderReview | Amber `#B5760B` | Magnifying glass | Cancel | Approve, Reject, Move to WaitingForDocuments |
| WaitingForDocuments | Amber `#B5760B` | Document-alert | Upload documents, Cancel | Move back to UnderReview |
| Approved | Green `#0E7C3A` | Check circle | View only | Issue Card |
| Rejected | Danger red `#C4314B` | X circle | View only (submit a new application) | View only |
| Cancelled | Muted red-gray `#8E5B5B` | Slash circle | View only | View only |

### CardStatus

| Status | Color | Icon | Allowed Actions (Admin) |
|---|---|---|---|
| Active | Green `#0E7C3A` | Shield-check | Suspend, Revoke, Renew, Replace, Rotate Token |
| Suspended | Amber `#B5760B` | Pause circle | Reactivate, Revoke, Replace, Rotate Token |
| Revoked | Danger red `#C4314B` | X circle | View only (terminal) |
| Superseded | Neutral gray | Arrow-swap | View only (terminal) |

### DocumentReviewStatus

| Status | Color | Icon | Notes |
|---|---|---|---|
| Pending | Amber `#B5760B` | Clock | Default and, today, effectively permanent — no review action exists yet (§17) |
| Approved | Green `#0E7C3A` | Check circle | |
| Rejected | Danger red `#C4314B` | X circle | Show `RejectionReason` when present |

### EligibilityStatus

| Status | Color | Icon |
|---|---|---|
| Eligible | Green `#0E7C3A` | Check circle |
| NotEligible | Danger red `#C4314B` | X circle |
| PendingReview | Amber `#B5760B` | Clock |
| Suspended | Muted red-gray `#8E5B5B` | Pause circle |
| Expired | Neutral gray | Calendar-x |

### VerificationStatus

| Status | Color | Icon |
|---|---|---|
| Verified | Green `#0E7C3A` | Check circle |
| NotVerified | Danger red `#C4314B` | X circle |
| Pending | Amber `#B5760B` | Clock |

### AuditRiskLevel (already defined in design-system.md §2 — repeated for completeness)

| Risk | Color | Rationale |
|---|---|---|
| Critical | `#A80000` | Unauthorized/forbidden access |
| High | `#C4314B` | Mutating clinical/insurance actions |
| Medium | `#B5760B` | Failed login |
| Low | `#0F6CBD` | Reads |
| Information | `#8A8886` | Successful login/register |

---

## 12. Error Messages

Every error maps 1:1 to the backend's real error taxonomy (`ServiceErrorKind` → HTTP status) — never invent an error state that can't actually occur.

| Scenario | Message | Severity | Suggested User Action |
|---|---|---|---|
| Login: wrong ID or password | "National ID or password is incorrect." | Danger | Re-check credentials — no field-level distinction |
| Registration: duplicate NationalId/Username | "An account with this National ID already exists — try signing in instead." | Danger | Link to Login |
| Any patient-scoped Clinical 404 | "No patient found with this National ID, or you don't have access to this record." | Neutral (not alarming) | Verify the ID; contact an Admin if access is expected |
| Enrollment: already has a non-terminal application | Redirect into the existing application, don't show as a hard error | Info | View existing application |
| Submit while not ready | Render the `missingRequirements` list verbatim | Warning | Complete the listed items |
| Document: wrong file type/size | "This file type isn't supported" / "File exceeds the 10MB limit" | Warning | Choose a different file |
| Upload: storage unavailable (502) | "Attachment storage is temporarily unavailable. Try again in a moment." | Danger (infrastructure, not user error) | Retry shortly |
| Visit: invalid status transition (409) | Show the actual reason text returned by the API | Danger | Reassess current status |
| Visit: add medication on closed visit (409) | Prevented before attempt via a page-level banner; if reached anyway, refresh | Warning | — |
| Category: duplicate Code (409) | "A category with this Code already exists." | Danger | Choose a different Code |
| Category: duplicate document requirement (409) | "This category already has a requirement for {DocumentType}." | Danger | Edit or remove the existing row instead |
| Card: issue against a non-Approved application (409) | Show the actual reason ("Application is not Approved") | Danger | — |
| Card: action on a Revoked/terminal card (409) | "This card is Revoked and cannot be modified." | Danger | A new Approved Application is required |
| Session expired (401) | "Your session has ended." (see `docs/ux/screens/session-expired-interstitial.md`) | Neutral | Sign in again |
| Genuine role gate (403) | "This area is restricted to Administrators." (stated plainly — not a privacy leak here) | Neutral | Return to your own landing screen |
| Generic server/network failure | "Something went wrong. Please try again." (or a network-specific variant) | Danger | Retry |

---

## 13. Empty States

| Page | Illustration | Title | Description | Primary Action | Secondary Action |
|---|---|---|---|---|---|
| Patient Search (pre-search) | Neutral icon | — | "Enter a 14-digit National ID to look up a patient." | — | — |
| Patient Search (no result) | Neutral icon | — | "No patient found with this National ID, or you don't have access to this record." | Try another ID | — |
| Medical Summary (no visits) | Neutral icon | — | "No visits recorded yet for this patient." | New Visit (Doctor/Admin) | — |
| Visit: no medications | — | — | "No medications recorded for this visit." | Add Medication (Doctor, open visit) | — |
| Visit: no attachments | — | — | "No attachments for this visit yet." | Upload (Doctor, open visit) | — |
| My Patients (Doctor, empty roster) | Neutral icon | — | "You have no patients yet. Search by National ID to look one up." | Go to Patient Search | — |
| Audit Log (no matches) | — | — | "No audit records match these filters." | Clear filters | — |
| My Dependents (none yet) | — | — | "No dependents registered yet." | Add Dependent | — |
| My Documents (none yet) | — | — | "No documents uploaded yet." | Upload Document | — |
| My Applications (none yet) | — | — | "No applications yet — start your enrollment to apply." | Start Enrollment | — |
| Insurance Status (no application) | — | — | Neutral prompt directing to enrollment | Start Enrollment | — |
| My Insurance Card (none issued) | — | — | "No insurance card issued yet. Once your application is approved, your card will appear here." | View Application Status | — |
| Insurance Categories (Admin, none configured) | — | — | "No insurance categories are currently available. Please check back later." (citizen-facing) | — | — |

---

## 14. Loading States

Reusing `docs/ux/01-design-system.md` §22 verbatim across both domains — one loading-state language, not two:

- **Sub-300ms responses**: no spinner at all.
- **List/table loads**: skeleton rows matching real row height (36px dense) and column layout, not generic shimmer blocks. Applies to: Visit History, My Patients, Audit Log, Dependents, Documents, Applications list, Cards list, Insurance Categories list.
- **Button loading**: async actions (Save, Submit, Upload, Issue Card, Review) show an in-button spinner and disable re-submission — never a page-level overlay for a single action.
- **File upload**: real percentage progress bar, not indeterminate — applies identically to Document Upload and Attachment Upload.
- **Audit chain verification**: indeterminate progress with "This may take a moment," duration reported back afterward as a trust signal.
- **Infinite scroll**: not used anywhere — every list in the product is either a small unpaginated array (internal scroll only, no "load more") or the one real paginated list (Audit Log, with a real pager control, not infinite scroll).

---

## 15. Design Tokens

Reused directly from `docs/ux/01-design-system.md` — **one design system across both domains**, not a separate Insurance palette. Full detail in that document; summary:

| Category | Values |
|---|---|
| **Spacing** | 4px base unit: `space-1`(4px) → `space-8`(48px), §5 |
| **Typography** | Segoe UI Variable, Display 28px → Caption 12px scale, tabular figures for National ID/dates/dosage/file sizes, §3 |
| **Border Radius** | Flat surfaces, 1px borders (`neutral-30`), not heavy consumer rounding/shadow — cards use a flat 1px border treatment, §7 |
| **Elevation** | Minimal — flat design language, no drop-shadow-heavy elevation system; dialogs use a dimmed backdrop, not shadow stacking, §20 |
| **Primary Colors** | `primary-base #0F6CBD`, `primary-hover #115EA3`, `primary-tint #E9F1FB`, §2 |
| **Success / Warning / Danger / Info** | `#0E7C3A` / `#B5760B` / `#C4314B` / `#0F6CBD`, §2 — the same four tokens back every status mapping in §11 above, including the Insurance-specific enums this guide adds |

---

## 16. Responsive Behavior

**This is a desktop-first product for Doctor and Admin, full stop** — `docs/ux/01-design-system.md` §26. Primary target 1440×900+, minimum supported 1024×768. **Do not design mobile breakpoints below 1024px for Doctor/Admin screens.**

| | Desktop (1440px+) | Tablet (1024–1439px) | Mobile (<1024px) |
|---|---|---|---|
| **Doctor / Admin (Clinical + Insurance Admin)** | Full two-column layouts where specified (Medical Summary), full table columns | Secondary columns drop first (per-screen priority order in `docs/ux/screens/*`), two-column layouts collapse to single-column | **Not a supported target.** No design work should target this range for these roles. |
| **Citizen Portal (Insurance)** | Full layout | Full layout, single-column forms already | **The one place mobile genuinely matters** — Registration is explicitly flagged as the most likely screen to be used on a phone/kiosk near-term (`docs/ux/screens/patient-self-registration.md` §10); the wizard and citizen dashboard should degrade to single-column cleanly. Treat the whole Citizen Portal as a lighter, separate responsive track from the dense Clinical UI — never try to cram Visit Detail/Audit-style density into a phone width. |

---

## 17. Future Enhancements

Everything below is a confirmed, explicit gap in the current backend — not something this guide's authors forgot to design, and not something to build a screen against. Each is cited to its source so it can be tracked back to the original design decision.

### Not implemented anywhere in the backend

- **Appointments / Scheduling.** No booking/calendar concept exists — `Visit` is the only encounter abstraction, always created with doctor/patient/date already decided. (`docs/ux/02-screen-inventory.md` Module 9)
- **Notifications** (any kind — email, SMS, push, or an in-app notification center). Only synchronous, client-triggered, session-local action-confirmation toasts are buildable today. (design-system.md §19)
- **Doctor/Admin self-service account management** (create, deactivate, reset password, edit profile). Both roles are seed/back-office-provisioned only. (`docs/ux/02-screen-inventory.md` Module 9)
- **"Browse all patients."** Only exact-match National ID search or a doctor's own roster — no directory/browse capability, by design. (design-system.md §9)
- **Password reset / "forgot password."** No such capability for any role. (`docs/ux/screens/login.md` §6)
- **Delete** for any clinical record (Visit, Diagnosis, Medication, Attachment) or Insurance record (Document, Dependent-person, Application, Card) — only status transitions / soft-end / append-new-version patterns exist. Never design a delete affordance for any of these.
- **Audit data export** (CSV/PDF). (design-system.md §29)
- **Doctor's own "today's schedule"** — no endpoint returns a doctor's visits directly, only per-patient. (`docs/ux/02-screen-inventory.md` Module 7)
- **A cross-patient Admin "review queue"** for Applications — Admin can view any patient's applications but there's no single endpoint listing every pending application across all patients (§4.3 note).
- **Document review action** — `ReviewStatus`/`ReviewedBy`/`ReviewedAt`/`RejectionReason` exist on the data model, but no endpoint sets them; every document is effectively `Pending` forever today.
- **Conditional document requirements** (e.g., "Marriage Certificate only if Married") — the data-model scaffold (`InsuranceCategoryDocumentRequirementCondition`) exists but is dormant: no Admin endpoint writes to it, and `EnrollmentReadinessService` never evaluates it. Every requirement is unconditionally required today, regardless of citizen profile.
- **Bilingual (Arabic/English, RTL) UI.** Backend DTOs are English-only with no localization fields — an open product/stakeholder question, not a solved one. (design-system.md §29)
- **PDF/Wallet card rendering.** The `GET /cards/{cardId}/pdf` endpoint contract exists, but the actual rendering engine and Apple/Google Wallet pass generation are explicitly deferred architecture-only decisions. (`digital-insurance-card-design.md` §14–15)
- **Self-service card renewal.** Renew/Replace/Rotate are Admin-only actions today — no Patient-facing renewal request path.
- **Offline card verification.** Every `Verify` call requires live connectivity — no cryptographic-signature offline scheme exists.
- **Rate limiting / lockout** on login, registration, card verification, or replace/rotate actions — logged (audit risk-classified) but not blocked.

### Explicitly flagged, real product-scope questions (not gaps to silently work around)

- Whether identity documents/family data should be visible to a treating Doctor at all (currently yes, via the shared `PatientPolicies.Access`) — flagged, not silently assumed, in `document-upload-and-dependents-design.md` §13.
- Whether a live eligibility re-check should gate card renewal — currently pure Admin discretion. (`insurance-card-lifecycle-design.md` §15)

---

*This guide reflects the backend contract as implemented at the time of writing. If a route, field, or enum value listed here doesn't match what Swagger shows at build time, trust Swagger — file a doc-drift note rather than building against a stale line in this guide.*
