# Domains 1 & 2 — UI, Logic & Implementation Reference

**Last updated:** 2026-08-13 · Source: Notion + Swagger (52 endpoints) + frontend-integration-guide.md

---

# Domain 1 — Insurance Core (Citizen-Facing)

> *"التحقق من أحقية المواطن في الاشتراك بالتأمين الصحي."*

## 1.1 Overview

The citizen journey through the insurance system: eligibility check → documents → dependents → application → review → card issuance → renewal.

This domain covers **all citizen-facing insurance flows** and **admin-side review/management**.

---

## 1.2 Flow Diagram

```
Register/Login
    │
    ▼
[Eligibility Check] ──── Domain 1, Section 1 ──── NEW
    │                              POST /api/insurance/eligibility/check
    │                              GET  /api/insurance/eligibility/{patientId}
    │
    ├── Eligible ────────────────▶ continue
    │
    └── Not Eligible ────────────▶ show reason, stop
    │
    ▼
[My Profile] ────────────────── Domain 1, Section 2 ──── MISSING
    │                              GET/PUT /api/profile
    │
    ▼
[My Documents] ──────────────── Domain 1, Section 3 ──── MISSING
    │                              POST /api/insurance/documents/upload
    │                              GET  /api/insurance/documents/{patientId}
    │                              GET  /api/insurance/documents/document/{documentId}
    │
    ▼
[My Dependents] ─────────────── Domain 1, Section 4 ──── MISSING
    │                              POST /api/insurance/dependents
    │                              GET  /api/insurance/dependents/{patientId}
    │                              PATCH /api/insurance/dependents/{id}/end
    │
    ▼
[My Applications] ───────────── Domain 1, Section 5 ──── MISSING
    │                              GET  /api/insurance/applications/{patientId}
    │                              GET  /api/insurance/applications/detail/{applicationId}
    │                              GET  /api/insurance/applications/by-number/{applicationNumber}
    │                              POST /api/insurance/applications
    │                              PATCH /api/insurance/applications/{applicationId}/submit
    │                              PATCH /api/insurance/applications/{applicationId}/cancel
    │                              PATCH /api/insurance/applications/{applicationId}/review  (Admin)
    │
    ▼
[Insurance Status Timeline] ─── Domain 1, Section 6 ──── MISSING
    │                              GET  /api/insurance/status/{patientId}
    │
    ▼
[My Insurance Card] ─────────── Domain 1, Section 7 ──── DRAFT BUILT
    │                              11 card endpoints (see §1.7)
    │
    ▼
[Point-of-Care Verification] ── Domain 1, Section 8 ──── MISSING (citizen view)
    │                              POST /api/insurance/verification/verify
    │                              GET  /api/insurance/verification/current/{patientId}
    │                              GET  /api/insurance/verification/{patientId}/history
    │                              GET  /api/insurance/verification/{patientId}/latest
```

---

## 1.3 Section 1 — Eligibility Verification ✅ REAL API

### Purpose
> هل الشخص ده يستحق يدخل منظومة التأمين الصحي أصلاً؟  
> One-time check before first card issuance.

### Business Rules
- Checked once before first card issuance
- System asks: Egyptian? · Valid National ID? · Already insured? · Employer in insurance scheme? · Student? · Pensioner? · Dependent child? · Current beneficiary? · Any issues blocking enrollment?
- If **eligible** → continue to document upload
- If **not eligible** → reject with reason

### Backend Flow
```
Citizen Applies
    ↓
POST /api/insurance/eligibility/check
    ↓
System Checks National Records
    ↓
Employment Status → Insurance Database
    ↓
Eligible  ────────▶ continue
    OR
Not Eligible  ─────▶ reject with reason
```

### APIs

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/insurance/eligibility/check` | Patient | Records an eligibility decision for a patient |
| `GET` | `/api/insurance/eligibility/{patientId}` | Patient/Admin | Gets current eligibility |

### UI Screens Needed

| Screen | Description | Status |
|--------|-------------|--------|
| **Apply for Insurance** | Entry point — citizen initiates eligibility request | ❌ MISSING |
| **Eligibility Result** | Shows eligible/not eligible with reason | ❌ MISSING |
| **Application Details** | After eligibility passes, shows what's needed next | ❌ MISSING |
| **Required Documents** | Lists documents needed after eligibility confirmed | ❌ MISSING (reuse My Documents) |
| **Reapply** | If rejected, allows re-application | ❌ MISSING |

### UI Components

- **Eligibility form** — no inputs needed (system-driven check), just a submit button with loading state
- **Eligibility result card** — large card showing:
  - ✅ Eligible: green badge + "You are eligible" + CTA to upload documents
  - ❌ Not Eligible: red badge + reason text + "Reapply" button
- **Loading state** — skeleton/spinner while checking national records

### Logic

```typescript
// On "Apply for Insurance" click:
// 1. Call POST /api/insurance/eligibility/check
// 2. On success: navigate to result screen
// 3. On eligible: show CTA → My Documents
// 4. On not eligible: show reason, allow Reapply
```

### Implementation URL

```
POST http://stg-api.runasp.net/api/insurance/eligibility/check
GET  http://stg-api.runasp.net/api/insurance/eligibility/{patientId}
```

### Page Route

```
/dashboard/insurance/eligibility          ← NEW
/dashboard/insurance/eligibility/result   ← NEW
```

---

## 1.4 Section 2 — My Profile ✅ REAL API

### Purpose
View and edit the citizen's extended profile — required before enrollment can proceed.

### APIs

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/profile` | Patient | Gets authenticated patient's profile (identity + citizen profile) |
| `PUT` | `/api/profile` | Patient | Updates citizen profile fields |

### UI Screens Needed

| Screen | Description | Status |
|--------|-------------|--------|
| **My Profile** (view) | Shows all profile fields · edit button | ❌ MISSING |
| **Edit Profile** (form) | Inline edit or separate form page | ❌ MISSING |

### Fields (from integration guide §4.1)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| First Name | text | Yes | From auth registration |
| Second Name | text | Yes | |
| Third Name | text | Yes | |
| Fourth Name | text | Yes | |
| National ID | text | Yes | |
| Date of Birth | date | Yes | |
| Gender | select | Yes | |
| Mobile Number | text | Yes | |
| Governorate | select | Yes | 27 Egyptian governorates |
| District | text | Yes | |
| Address | text | Yes | |
| Occupation | text | Yes | Gates enrollment readiness |
| Marital Status | select | Yes | Gates enrollment readiness |
| Nationality | select | Yes | |
| Emergency Contact | text | Yes | |

### Profile Completeness

> `profileComplete` is false if Occupation/MaritalStatus/Nationality/EmergencyContact are missing.

This gates the enrollment wizard's Step 2 (Profile Check).

### UI Components

- **Profile card** — read-only view with all fields + Edit button
- **Edit form** — form with all editable fields + Save button
- **Completeness indicator** — progress bar or badge showing what's missing
- **Inline validation** — Zod schemas per field group

### Logic

```typescript
// Profile completeness check:
const requiredForReadiness = ['occupation', 'maritalStatus', 'nationality', 'emergencyContact'];
const isComplete = requiredForReadiness.every(f => profile[f] != null);

// On save:
// 1. Validate form locally
// 2. PUT /api/profile
// 3. On success: show success toast, refresh view
```

### Implementation URL

```
GET  http://stg-api.runasp.net/api/profile
PUT  http://stg-api.runasp.net/api/profile
```

### Page Route

```
/dashboard/insurance/profile         ← NEW
```

---

## 1.5 Section 3 — My Documents ✅ REAL API

### Purpose
Upload and review identity/supporting documents for the citizen (and their dependents).

### APIs

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/insurance/documents/upload` | Patient | Uploads (or replaces) a document |
| `GET` | `/api/insurance/documents/{patientId}` | Patient | Gets full document history |
| `GET` | `/api/insurance/documents/document/{documentId}` | Patient | Gets single document metadata + secure download URL |

### Upload Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| **DocumentType** | select | Yes | Closed set of 8 (see §1.5.1) |
| **File** | file | Yes | PDF/JPG/JPEG/PNG, ≤10MB |
| **ExpiresAt** | date | No | e.g. National ID printed expiry |
| **DependentPersonId** | select | No | "Myself" or a specific dependent |

### DocumentType — Closed Set of 8 (§6.3)

| # | Value | Description |
|---|-------|-------------|
| 1 | `NationalId` | بطاقة رقم قومي — front/back |
| 2 | `BirthCertificate` | شهادة ميلاد |
| 3 | `MarriageCertificate` | قسيمة زواج |
| 4 | `EmploymentLetter` | خطاب جهة العمل |
| 5 | `DisabilityCertificate` | شهادة إعاقة |
| 6 | `DeathCertificate` | شهادة وفاة |
| 7 | `GuardianAuthorization` | تفويض guardian |
| 8 | `FamilyRegistration` | رسم 바젤/تسجيل عائلة |

> No "Other", no free text.

### Business Rules

- Re-uploading a DocumentType never overwrites — creates new "current" row (`IsCurrent: true`); old row stays as history
- Only `IsActive` AND `IsMandatory` document types on a category are "required"
- ReviewStatus: `Pending` (default, no admin review action yet) / `Approved` / `Rejected` (`RejectionReason` shown when present)
- 502 if Cloudinary unavailable — distinct "storage unavailable" message
- 400 if DependentPersonId isn't actually sponsored by caller

### UI Screens Needed

| Screen | Description | Status |
|--------|-------------|--------|
| **My Documents** (list) | Table/grid grouped by DocumentType · each row: type icon, Current badge, Review Status badge, upload date, expiry, View action · + Upload button | ❌ MISSING |
| **Upload Dialog** | DocumentType select + File picker + optional ExpiresAt + DependentPersonId select · drag & drop + browse fallback · real percentage progress | ❌ MISSING |
| **Document Viewer** | Opens single document from Cloudinary URL | ❌ MISSING (simple modal) |

### UI Components

**Document Grid/Table** (per §41):

Each row shows:
- Type icon (per DocumentType)
- **"Current" badge** (`IsCurrent` — green if true)
- **Review Status badge** (`Pending`/`Approved`/`Rejected`)
- Upload date
- Expiry (if set)
- **"View" action** button → opens document

**Upload Dialog**:
- Drag-and-drop zone + browse fallback
- Constraints stated upfront: "PDF/JPG/JPEG/PNG, ≤10MB"
- Real percentage progress bar (not indeterminate)
- DocumentType select (closed set of 8)
- File input
- Optional: ExpiresAt date picker
- Optional: DependentPersonId select ("Myself" or dependent dropdown)
- Submit button → `POST /api/insurance/documents/upload`

**Empty State**: *"No documents uploaded yet."* with Upload action prominent.

### Logic

```typescript
// Upload flow:
// 1. Open upload dialog
// 2. Select DocumentType from 8-value dropdown
// 3. Select file (client-validate: type + size)
// 4. Optionally set ExpiresAt + DependentPersonId
// 5. Submit → POST /api/insurance/documents/upload (multipart/form-data)
// 6. On success: refresh document list, show success toast
// 7. On 502: show "storage unavailable" message
// 8. On 400: show field-specific error

// Re-upload:
// Same flow — backend creates new "current" row, old stays as history
// UI should show "Current" badge on the latest upload per type
```

### Implementation URL

```
POST http://stg-api.runasp.net/api/insurance/documents/upload
GET  http://stg-api.runasp.net/api/insurance/documents/{patientId}
GET  http://stg-api.runasp.net/api/insurance/documents/document/{documentId}
```

### Page Route

```
/dashboard/insurance/documents      ← NEW
```

---

## 1.6 Section 4 — My Dependents ✅ REAL API

### Purpose
Manage family members registered under the citizen's insurance.

### APIs

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/insurance/dependents` | Patient | Registers a dependent |
| `GET` | `/api/insurance/dependents/{patientId}` | Patient | Gets patient's dependents + relationship status |
| `PATCH` | `/api/insurance/dependents/{relationshipId}/end` | Patient | Ends a family relationship (divorce, revoked guardianship, etc.) |

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Full Name | text | Yes | |
| Relationship | select | Yes | Wife, Son, Daughter, Father, Mother, Other |
| Date of Birth | date | Yes | |
| National ID | text | Yes | 14 digits |
| Gender | select | Yes | |
| Documents | file | Yes | Required documents for the dependent |

### UI Screens Needed

| Screen | Description | Status |
|--------|-------------|--------|
| **My Dependents** (list) | Table: Name, Relationship, DOB, Active/Ended badge · + Add Dependent button → form/drawer | ❌ MISSING |
| **Add Dependent** (form/drawer) | Full form with all fields + document upload · validate before submit | ❌ MISSING |
| **End Relationship** (action) | Per-row action on active relationships → confirmation dialog | ❌ MISSING |

### UI Components

- **Dependent card/table**: Name, Relationship, DOB, Active/Ended badge
- **Add Dependent drawer/form**: all fields + Save
- **End Relationship button**: only on active rows → confirmation dialog
- **Relationship badge**: color-coded (active = green, ended = muted)

### Logic

```typescript
// Add Dependent:
// 1. Open drawer/form
// 2. Fill fields + upload dependent documents
// 3. POST /api/insurance/dependents
// 4. On success: refresh list, close drawer

// End Relationship:
// 1. Click "End" on active dependent row
// 2. Confirm dialog: "Are you sure?"
// 3. PATCH /api/insurance/dependents/{relationshipId}/end
// 4. On success: refresh list, row shows "Ended"
```

### Implementation URL

```
POST http://stg-api.runasp.net/api/insurance/dependents
GET  http://stg-api.runasp.net/api/insurance/dependents/{patientId}
PATCH http://stg-api.runasp.net/api/insurance/dependents/{relationshipId}/end
```

### Page Route

```
/dashboard/insurance/dependents      ← NEW
```

---

## 1.7 Section 5 — My Applications ✅ REAL API

### Purpose
List every application the citizen has ever submitted; view one in detail; track its live status.

### APIs

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/insurance/applications/{patientId}` | Patient | List, newest first |
| `GET` | `/api/insurance/applications/detail/{applicationId}` | Patient | Full detail + review history |
| `GET` | `/api/insurance/applications/by-number/{applicationNumber}` | Patient | Human-readable lookup |
| `POST` | `/api/insurance/applications` | Patient | Creates a new Draft application |
| `PATCH` | `/api/insurance/applications/{applicationId}/submit` | Patient | Submits Draft for review |
| `PATCH` | `/api/insurance/applications/{applicationId}/cancel` | Patient | Cancels non-terminal application |
| `PATCH` | `/api/insurance/applications/{applicationId}/review` | Admin | Records review decision |

### Status Values

| Status | Color | Icon | Patient Actions | Admin Actions |
|--------|-------|------|-----------------|---------------|
| **Draft** | Neutral gray | Pencil | Submit, Cancel | — |
| **Submitted** | Info blue `#0F6CBD` | Paper-plane | Cancel | Move to UnderReview |
| **UnderReview** | Amber `#B5760B` | Magnifying glass | Cancel | Approve, Reject, Move to WaitingForDocuments |
| **WaitingForDocuments** | Amber `#B5760B` | Document-alert | Upload documents, Cancel | Move back to UnderReview |
| **Approved** | Green `#0E7C3A` | Check circle | View only | Issue Card |
| **Rejected** | Danger red `#C4314B` | X circle | View only (submit new) | View only |
| **Cancelled** | Muted red-gray `#8E5B5B` | Slash circle | View only | View only |

### Business Rules

- At most **one non-terminal application** at a time (409 on second POST)
- Non-terminal: Draft, Submitted, UnderReview, WaitingForDocuments
- Terminal: Approved, Rejected, Cancelled — no further transition
- Rejected citizen submits brand-new application
- Every review decision must include a reason (`CitizenVisibleReason`)

### UI Screens Needed

| Screen | Description | Status |
|--------|-------------|--------|
| **My Applications** (list) | List: ApplicationNumber (e.g. `APP-2026-00000008`), Status badge, SubmittedAt, DocumentCount/DependentCount · click → detail | ❌ MISSING |
| **Application Detail** | Full status timeline · review history (citizen sees `CitizenVisibleReason` only — NEVER `InternalNotes`) · Cancel Application action (non-terminal only) · "Start Enrollment" if Draft | ❌ MISSING |
| **Cancel Confirmation** | Dialog before cancelling · shows policy · confirm/cancel buttons | ❌ MISSING |

### UI Components

**Application List Item**:
- ApplicationNumber (`APP-2026-00000008`)
- Status badge (color + icon per table above)
- SubmittedAt date
- DocumentCount / DependentCount
- Click → detail page

**Application Detail**:
- Status timeline (Submitted → Documents on file → Eligibility → Verification → Approved/Rejected)
- Review history with `CitizenVisibleReason` only
- Actions: Submit (if Draft), Cancel (if non-terminal), View Card (if Approved)
- **Empty state**: *"No applications yet — start your enrollment to apply."*

### Logic

```typescript
// Create application:
// 1. POST /api/insurance/applications → returns Draft with applicationId
// 2. Navigate to detail page

// Submit:
// 1. PATCH /api/insurance/applications/{applicationId}/submit
// 2. On success: status → Submitted, refresh

// Cancel:
// 1. Show confirmation dialog
// 2. PATCH /api/insurance/applications/{applicationId}/cancel
// 3. On success: status → Cancelled, refresh

// Check if can submit:
// - Must have required documents uploaded
// - Must have eligibility check passed
// - Backend enforces via readiness check
```

### Implementation URL

```
GET  http://stg-api.runasp.net/api/insurance/applications/{patientId}
GET  http://stg-api.runasp.net/api/insurance/applications/detail/{applicationId}
GET  http://stg-api.runasp.net/api/insurance/applications/by-number/{applicationNumber}
POST http://stg-api.runasp.net/api/insurance/applications
PATCH http://stg-api.runasp.net/api/insurance/applications/{applicationId}/submit
PATCH http://stg-api.runasp.net/api/insurance/applications/{applicationId}/cancel
PATCH http://stg-api.runasp.net/api/insurance/applications/{applicationId}/review
```

### Page Routes

```
/dashboard/insurance/applications        ← NEW (list)
/dashboard/insurance/applications/{id}   ← NEW (detail)
```

---

## 1.8 Section 6 — Insurance Status Timeline ✅ REAL API

### Purpose
One citizen-facing timeline view answering "where is my enrollment right now."

### API

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/insurance/status/{patientId}` | Patient | Aggregated insurance status timeline |

### Timeline Stages (from `TimelineStageDto`)

| Stage | Description |
|-------|-------------|
| Submitted | Application submitted |
| Documents on file | Required documents uploaded |
| Eligibility status | Eligibility check result |
| Verification status | If present |
| Approved / Rejected | Final outcome |

> **Do NOT add "Card Issued"/"Card Active" stage** — not part of this timeline's contract.

### UI Screens Needed

| Screen | Description | Status |
|--------|-------------|--------|
| **Status Timeline** (widget) | Horizontal/vertical timeline · each stage: name, complete/incomplete, timestamp · embed on dashboard or standalone page | ❌ MISSING |

### UI Components

- **Timeline component**: stages in order · completed stages green, current stage blue, future stages gray
- **Stage card**: name, timestamp, status indicator
- **Empty state**: "No current application — show a neutral prompt directing to Start Enrollment"

### Implementation URL

```
GET http://stg-api.runasp.net/api/insurance/status/{patientId}
```

### Page Route

```
/dashboard/insurance/status          ← NEW (or widget on dashboard)
```

---

## 1.9 Section 7 — My Insurance Card ✅ REAL API (11 endpoints)

### Purpose
View every card the citizen (and their dependents) has ever held; see the current valid one; download it.

### APIs

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/insurance/cards/{patientId}` | Patient | Full history, newest first |
| `GET` | `/api/insurance/cards/current/{patientId}` | Patient | Currently-valid card (404 if none) |
| `GET` | `/api/insurance/cards/detail/{cardId}` | Patient | Full detail + status-change history |
| `POST` | `/api/insurance/cards/issue/{applicationId}` | Admin | Issues cards for Approved application |
| `POST` | `/api/insurance/cards/verify` | Doctor/Admin | Verifies scanned card token (point-of-care) |
| `PATCH` | `/api/insurance/cards/{cardId}/suspend` | Admin | Suspends a card |
| `PATCH` | `/api/insurance/cards/{cardId}/reactivate` | Admin | Reactivates suspended card |
| `POST` | `/api/insurance/cards/{cardId}/renew` | Admin | Renews — fresh successor, full new validity |
| `POST` | `/api/insurance/cards/{cardId}/replace` | Admin | Replaces lost/damaged/stolen — fresh successor |
| `PATCH` | `/api/insurance/cards/{cardId}/revoke` | Admin | Revokes (terminal) |
| `PATCH` | `/api/insurance/cards/{cardId}/rotate-token` | Admin | Rotates VerificationToken (no status change) |

### Card Fields

| Field | Description |
|-------|-------------|
| CardNumber | Unique card identifier |
| HolderFullName | Name of the cardholder |
| IssuedAt | Issue date |
| ExpiresAt | Expiration date |
| QR Code | Server-rendered (NOT the raw VerificationToken) |
| Insurance Class | |
| Family Number | |
| Status | Active / Suspended / Revoked / Superseded |

### Card Status Values

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| **Active** | Green `#0E7C3A` | Check circle | Currently valid |
| **Suspended** | Amber `#B5760B` | Magnifying glass | Temporarily inactive |
| **Revoked** | Danger red `#C4314B` | X circle | Permanently cancelled |
| **Superseded** | Muted red-gray `#8E5B5B` | Slash circle | Replaced by newer card |

### Business Rules

- Issue only succeeds against an `Approved` application
- Issue only when target scope has no existing non-terminal card
- Renew requires card to be `Active`
- Replace accepts `Active` OR `Suspended`
- Revocation is permanent — only path forward is new Approved Application
- Rotate Token changes only QR secret — CardNumber, Status, ExpiresAt never change

### UI Screens Needed

| Screen | Description | Status |
|--------|-------------|--------|
| **My Card** (main) | Current active card visual + Download PDF + history list | 🟡 DRAFT BUILT |
| **Card Visual** | CardNumber, HolderFullName, IssuedAt/ExpiresAt, QR code (server-rendered), Insurance Class, Family Number, Status badge | 🟡 PARTIAL |
| **Download PDF** | `GET /api/insurance/cards/{cardId}/pdf` — ⚠️ NOT in Swagger, may be missing | ❌ MISSING |
| **History List** | Superseded/revoked cards distinctly using `IsLatestCard` flag | ❌ MISSING |
| **Empty State** | *"No insurance card issued yet. Once your application is approved, your card will appear here."* | ❌ MISSING |

### UI Components

**Card Visual** (physical card design):
- Card number (prominent)
- Holder full name
- Issue date / Expiry date
- QR code (from server, never raw token)
- Insurance class
- Family number
- Status badge
- Simulated card appearance (rounded rectangle, gradient, chip icon, etc.)

**Download Button**: Download PDF action

**History List**: table of all cards with status badge + dates + "IsLatestCard" indicator

### Logic

```typescript
// View current card:
// 1. GET /api/insurance/cards/current/{patientId}
// 2. On 404: show empty state
// 3. On success: render card visual

// View history:
// 1. GET /api/insurance/cards/{patientId}
// 2. Render list, mark IsLatestCard

// Download PDF:
// 1. GET /api/insurance/cards/{cardId}/pdf
// 2. Trigger browser download
// ⚠️ Endpoint may not exist — verify against Swagger
```

### Implementation URL

```
GET  http://stg-api.runasp.net/api/insurance/cards/{patientId}
GET  http://stg-api.runasp.net/api/insurance/cards/current/{patientId}
GET  http://stg-api.runasp.net/api/insurance/cards/detail/{cardId}
GET  http://stg-api.runasp.net/api/insurance/cards/{cardId}/pdf    ⚠️ MAY NOT EXIST
POST http://stg-api.runasp.net/api/insurance/cards/issue/{applicationId}   (Admin)
POST http://stg-api.runasp.net/api/insurance/cards/verify                    (Doctor/Admin)
PATCH http://stg-api.runasp.net/api/insurance/cards/{cardId}/suspend         (Admin)
PATCH http://stg-api.runasp.net/api/insurance/cards/{cardId}/reactivate      (Admin)
POST http://stg-api.runasp.net/api/insurance/cards/{cardId}/renew            (Admin)
POST http://stg-api.runasp.net/api/insurance/cards/{cardId}/replace          (Admin)
PATCH http://stg-api.runasp.net/api/insurance/cards/{cardId}/revoke          (Admin)
PATCH http://stg-api.runasp.net/api/insurance/cards/{cardId}/rotate-token    (Admin)
```

### Page Routes

```
/dashboard/insurance/card         ← BUILT (draft, needs enhancement)
```

---

## 1.10 Section 8 — Point-of-Care Insurance Verification ✅ REAL API

### Purpose
Verify insurance validity during use of any service (appointment, consultation, pharmacy, lab, radiology).

### APIs

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/insurance/verification/verify` | Doctor/Admin | Records a verification decision |
| `GET` | `/api/insurance/verification/current/{patientId}` | Patient/Admin | Currently valid verification |
| `GET` | `/api/insurance/verification/{patientId}/history` | Patient/Admin | Full verification history |
| `GET` | `/api/insurance/verification/{patientId}/latest` | Patient/Admin | Most recent verification |

### Used In
- الحجز (Booking)
- الكشف (Consultation)
- الصيدلية (Pharmacy)
- التحاليل (Lab)
- الأشعة (Radiology)

### Rules
- Expired card cannot be used
- Suspended card cannot be used

### UI (Citizen View) — Status Check

| Screen | Description | Status |
|--------|-------------|--------|
| **Insurance Status Check** | Shows current insurance validity for the citizen (read-only) | ❌ MISSING |

### UI (Doctor/Admin View) — Verification Action

| Screen | Description | Status |
|--------|-------------|--------|
| **Verify Insurance** (form/dialog) | PatientId, Status (Verified/NotVerified/Pending), Context (Appointment/CheckIn/ClinicVisit/EmergencyAdmission/Billing), Reason, optional Remarks | ❌ MISSING |
| **Verify Card** (QR scan) | Scan QR → POST /verify → show result (CardNumber, HolderFullName, IsCurrentlyValid, ExpiresAt, Status) — deliberately no NationalId/Address/Mobile | ❌ MISSING |

### Implementation URL

```
POST http://stg-api.runasp.net/api/insurance/verification/verify
GET  http://stg-api.runasp.net/api/insurance/verification/current/{patientId}
GET  http://stg-api.runasp.net/api/insurance/verification/{patientId}/history
GET  http://stg-api.runasp.net/api/insurance/verification/{patientId}/latest
```

---

## 1.11 Gap Summary — Domain 1

| # | Item | Status | Action |
|---|------|--------|--------|
| 1 | Eligibility Check page | ❌ MISSING | Build new |
| 2 | My Profile page | ❌ MISSING | Build new |
| 3 | My Documents page | ❌ MISSING | Build new |
| 4 | My Dependents page | ❌ MISSING | Build new |
| 5 | My Applications page | ❌ MISSING | Build new |
| 6 | Status Timeline widget | ❌ MISSING | Build new |
| 7 | My Card (full version) | 🟡 DRAFT | Enhance |
| 8 | Card PDF download | ⚠️ May not exist | Verify endpoint |
| 9 | Point-of-Care Verify (citizen) | ❌ MISSING | Build read-side |
| 10 | Point-of-Care Verify (Doctor/Admin) | ❌ MISSING | Build action UI |
| 11 | Apple/Google Wallet | ❌ NOT IMPLEMENTED | §17 gap |
| 12 | Self-service renewal | ❌ NOT IMPLEMENTED | §17 gap (Admin-only) |
| 13 | Document review action | ❌ NOT IMPLEMENTED | §17 gap (no endpoint) |

---

# Domain 2 — Appointment Management

> *"المسؤول عن إدارة دورة حياة المواعيد الطبية بالكامل..."*

## 2.1 Overview

> ⚠️ **NOT IMPLEMENTED** — Zero backend endpoints exist.

The Notion page describes a complete appointment system. The Swagger spec has **zero** appointment/hospital/clinic/slot endpoints. The integration guide §17 confirms: *"Appointments: Not implemented. There is no scheduling/booking concept anywhere in the backend."*

**This domain is DESIGN SPEC ONLY until the backend adds these endpoints.**

---

## 2.2 Flow Diagram (Design Intent)

```
[Hospital Search] ────────────── Domain 2, Sub-feature 1
    │                              GET /hospitals (❌ NOT IMPLEMENTED)
    │                              GET /hospitals/{id} (❌ NOT IMPLEMENTED)
    │
    ▼
[Clinic Browse] ──────────────── Domain 2, Sub-feature 2
    │                              GET /hospitals/{hospitalId}/clinics (❌)
    │                              GET /clinics/{id} (❌)
    │
    ▼
[Doctor Search] ──────────────── Domain 2, Sub-feature 3
    │                              GET /clinics/{clinicId}/doctors (❌)
    │                              GET /doctors/{id} (❌)
    │
    ▼
[Doctor Schedule] ────────────── Domain 2, Sub-feature 4
    │                              GET /doctors/{doctorId}/schedule (❌)
    │
    ▼
[Available Slots] ────────────── Domain 2, Sub-feature 5
    │                              GET /doctors/{doctorId}/available-slots?date={date} (❌)
    │
    ▼
[Book Appointment] ───────────── Domain 2, Sub-feature 6
    │                              POST /appointments (❌)
    │                              GET /appointments/{id} (❌)
    │
    ▼
[Appointment Confirmation] ───── Domain 2, Sub-feature 7
    │                              GET /appointments/{id} (❌)
    │                              POST /notifications/appointment-confirmation (❌)
    │
    ▼
[Reschedule] ─────────────────── Domain 2, Sub-feature 8
    │                              PUT /appointments/{id}/reschedule (❌)
    │                              GET /appointments/{id}/available-slots (❌)
    │
    ▼
[Cancel Appointment] ─────────── Domain 2, Sub-feature 9
    │                              PUT /appointments/{id}/cancel (❌)
    │
    ▼
[Reminders] ──────────────────── Domain 2, Sub-feature 10
    │                              POST /notifications/appointment-reminder (❌)
    │
    ▼
[My Appointments] ────────────── Domain 2, Sub-feature 11
    │                              GET /appointments (❌)
    │                              GET /appointments/{id} (❌)
```

---

## 2.3 Sub-feature 1 — Hospital Search ❌ NOT IMPLEMENTED

### UI Screens
- Hospital Search (search bar + filters)
- Hospital List (cards with name, location, governorate)
- Hospital Details (full info)

### Filters
- Governorate
- City
- Hospital name

### Business Rules
- Show active hospitals only
- Search by name or location
- Multiple filters supported
- Results update instantly

### Spec (for when API exists)

```
GET /hospitals?governorate={}&city={}&name={}&page={}&size={}
GET /hospitals/{id}
```

---

## 2.4 Sub-feature 2 — Clinic Browse ❌ NOT IMPLEMENTED

### UI Screens
- Clinics List (inside selected hospital)
- Clinic Details (optional)

### Business Rules
- Show clinics for selected hospital only
- Active clinics only
- Search by clinic name or specialty
- Sort alphabetically or by usage
- Cannot select unavailable clinic

### Spec

```
GET /hospitals/{hospitalId}/clinics
GET /clinics/{id}
```

---

## 2.5 Sub-feature 3 — Doctor Search ❌ NOT IMPLEMENTED

### UI Screens
- Doctors List (inside selected clinic)
- Doctor Profile (optional)

### Doctor Card Shows
- Name
- Specialty
- Degree (Consultant, Specialist, Resident...)
- Years of experience (optional)
- Availability status (Available / Fully Booked)
- **View Schedule** button

### Business Rules
- Doctors in selected clinic only
- Active doctors only
- Search by name
- Filter by specialty, gender, language
- Cannot select unavailable doctor

### Spec

```
GET /clinics/{clinicId}/doctors
GET /doctors/{id}
```

---

## 2.6 Sub-feature 4 — Doctor Schedule ❌ NOT IMPLEMENTED

### UI Screens
- Doctor Schedule (Calendar or Week View)

### UI Notes
- Show working days and hours
- Show holidays
- Highlight selected day
- Disabled days shown for unavailable

### Business Rules
- Show current schedule only
- Hide unavailable days
- Update when doctor's schedule changes
- Cannot select day outside schedule

### Spec

```
GET /doctors/{doctorId}/schedule
```

---

## 2.7 Sub-feature 5 — Available Slots ❌ NOT IMPLEMENTED

### UI Screens
- Available Slots (list or grid of time slots)

### UI Notes
- Show available times
- Highlight selected slot
- Disabled for unavailable slots
- Message when no slots available

### Business Rules
- Available slots only
- Cannot book already-reserved slot
- Update immediately on booking/cancellation
- Prevent concurrent booking of same slot
- Cannot book in the past

### Spec

```
GET /doctors/{doctorId}/available-slots?date={date}
```

---

## 2.8 Sub-feature 6 — Book Appointment ❌ NOT IMPLEMENTED

### UI Screens
- Book Appointment (summary screen)
- Booking Summary (before confirmation)

### UI Notes
- Show booking summary before confirm
- Show hospital, clinic, doctor details
- Show selected date and time
- Clear Confirm button
- Error message on booking failure

### Business Rules
- Insurance must be valid
- Slot must be available
- Cannot double-book
- Cannot book in past
- Slot is reserved immediately on success

### Spec

```
POST /appointments
GET /appointments/{id}
```

### Logic

```typescript
// Booking flow:
// 1. Validate insurance (call verification API)
// 2. Validate slot still available
// 3. POST /appointments with doctorId, date, time, patientId
// 4. On success: navigate to confirmation
// 5. On 409 (duplicate): show error
// 6. On 400 (invalid): show error
```

---

## 2.9 Sub-feature 7 — Appointment Confirmation ❌ NOT IMPLEMENTED

### UI Screens
- Appointment Confirmation (success screen)

### UI Shows
- Success message
- Appointment Number (unique)
- Hospital, Clinic, Doctor
- Date and Time
- Buttons: View Appointment · Add to Calendar · Back to Home

### Business Rules
- Shown only after successful booking
- Unique appointment number generated
- Confirmation notification sent to citizen
- Initial status: Confirmed or Booked

### Spec

```
GET /appointments/{id}
POST /notifications/appointment-confirmation
```

---

## 2.10 Sub-feature 8 — Reschedule ❌ NOT IMPLEMENTED

### UI Screens
- Appointment Details
- Reschedule Appointment
- Reschedule Confirmation

### UI Notes
- Show current appointment
- Show available slots only
- Show old vs new before confirm
- Success message after

### Business Rules
- Future appointments only
- New slot must be available
- Old slot released on success
- Reschedule notification sent
- Cannot reschedule after appointment starts

### Spec

```
PUT /appointments/{id}/reschedule
GET /appointments/{id}/available-slots
```

### Logic

```typescript
// Reschedule flow:
// 1. Load current appointment
// 2. Load available slots for new date
// 3. Select new slot
// 4. PUT /appointments/{id}/reschedule
// 5. On success: show confirmation, old slot released
```

---

## 2.11 Sub-feature 9 — Cancel Appointment ❌ NOT IMPLEMENTED

### UI Screens
- Appointment Details
- Cancel Appointment (confirmation dialog)
- Cancellation Confirmation

### UI Notes
- Confirmation before cancel
- Cancellation policy (if any)
- Success message after

### Business Rules
- Future appointments only
- Confirm before execute
- Status → Cancelled
- Time slot released for rebooking
- Cancellation notification sent
- Cannot cancel completed appointment

### Spec

```
PUT /appointments/{id}/cancel
```

### Logic

```typescript
// Cancel flow:
// 1. Show confirmation dialog
// 2. Confirm → PUT /appointments/{id}/cancel
// 3. On success: status → Cancelled, slot released, notification sent
```

---

## 2.12 Sub-feature 10 — Appointment Reminders ❌ NOT IMPLEMENTED

### UI Screens
- Notification Center (optional)

### UI Notes
- Show appointment details in notification
- Deep link to appointment details from notification

### Business Rules
- Reminders for confirmed appointments only
- Multiple reminders per policy
- SMS / Email / Push Notification
- Reminder cancelled if appointment cancelled

### Spec

```
POST /notifications/appointment-reminder
```

> Note: Notifications are a §17 gap — no notification service exists. This sub-feature depends on backend adding notification support.

---

## 2.13 Sub-feature 11 — My Appointments ❌ NOT IMPLEMENTED

### UI Screens
- My Appointments (list)
- Appointment Details

### UI Notes
- Categorize: Upcoming / Completed / Cancelled
- Filter by status
- Status badge per appointment
- Sort newest first

### Business Rules
- Show all citizen's appointments
- Categorize by status
- View any appointment detail
- Default sort: newest first

### Spec

```
GET /appointments
GET /appointments/{id}
```

---

## 2.14 Gap Summary — Domain 2

| # | Sub-feature | Backend Status | Action |
|---|-------------|---------------|--------|
| 1 | Hospital Search | ❌ No endpoints | Wait for backend |
| 2 | Clinic Browse | ❌ No endpoints | Wait for backend |
| 3 | Doctor Search | ❌ No endpoints | Wait for backend |
| 4 | Doctor Schedule | ❌ No endpoints | Wait for backend |
| 5 | Available Slots | ❌ No endpoints | Wait for backend |
| 6 | Book Appointment | ❌ No endpoints | Wait for backend |
| 7 | Appointment Confirmation | ❌ No endpoints | Wait for backend |
| 8 | Reschedule | ❌ No endpoints | Wait for backend |
| 9 | Cancel Appointment | ❌ No endpoints | Wait for backend |
| 10 | Reminders | ❌ No endpoints + §17 notification gap | Wait for both |
| 11 | My Appointments | ❌ No endpoints | Wait for backend |

### What Exists Today (Related)

The closest thing to "appointments" in the real backend is the **`Visit`** concept — but that's Doctor-created, not citizen-bookable:

| Endpoint | Purpose | Who Creates |
|----------|---------|-------------|
| `POST /api/visits` | Creates a visit linking patient + doctor | Doctor |
| `GET /api/visits/{id}` | Get visit details | Doctor/Patient |
| `PUT /api/visits/{id}` | Update diagnosis/notes/tests | Doctor |
| `POST /api/visits/{id}/medications` | Add medications | Doctor |
| `PATCH /api/visits/{id}/status` | Transition status | Doctor |
| `POST /api/visits/{visitId}/attachments` | Upload attachment | Doctor |

**Conclusion**: Domain 2 cannot be built until the backend adds all the missing endpoints. The `Visit` APIs are a different concept (clinical encounter, not appointment booking).

---

## 2.15 Recommended Approach for Domain 2

### Option A: Wait for Backend
- Mark all Domain 2 pages as "Coming Soon" placeholder pages
- Build UI scaffolding (components, layouts) for when APIs arrive

### Option B: Build with Mock Data
- Build full UI against mock/hardcoded data
- Swap in real API calls when endpoints are available
- Useful for design validation and demo purposes

### Option C: Hybrid — Build What's Ready
- Build the **My Appointments** list/ detail UI against mock data
- Build the **booking flow UI** (search → select → schedule → slots → book → confirm) as a connected wizard with mock steps
- All components are reusable when real APIs arrive

---

## 2.16 UI Component Inventory (Domain 2 — Future)

When APIs become available, build these components:

| Component | Used In | Description |
|-----------|---------|-------------|
| **Hospital Search Bar** | Hospital Search | Search input + governorate/city filters |
| **Hospital Card** | Hospital List | Name, location, governorate, distance (optional) |
| **Clinic Card** | Clinic Browse | Name, specialty, doctor count |
| **Doctor Card** | Doctor Search | Name, degree, specialty, experience, availability badge, View Schedule button |
| **Schedule Calendar** | Doctor Schedule | Week/calendar view, working days, highlighted selection |
| **Slot Grid** | Available Slots | Time slots in list/grid, selected highlight, disabled state |
| **Booking Summary** | Book Appointment | Recap of hospital/clinic/doctor/date/time before confirm |
| **Confirmation Screen** | Appointment Confirmation | Success message, appointment number, actions |
| **Reschedule Dialog** | Reschedule | Current vs new slot picker |
| **Cancel Dialog** | Cancel | Confirmation with policy |
| **Appointment List Item** | My Appointments | Date, time, doctor, clinic, status badge |
| **Status Badge** | All screens | Upcoming (blue) / Completed (green) / Cancelled (red-gray) |

---

## 2.17 Status Color Mapping (from §11 of guide)

| Status | Color | Hex |
|--------|-------|-----|
| Confirmed/Booked | Info blue | `#0F6CBD` |
| Completed | Success green | `#0E7C3A` |
| Cancelled | Muted red-gray | `#8E5B5B` |
| Pending | Amber | `#B5760B` |

---

# Summary: What to Build Now

## ✅ Buildable Now (Domain 1 — Real APIs)

| Priority | Page | APIs | Effort |
|----------|------|------|--------|
| 1 | Eligibility Check | `POST/GET /insurance/eligibility/...` | Small |
| 2 | My Documents | `POST/GET /insurance/documents/...` | Medium |
| 3 | My Dependents | `POST/GET/PATCH /insurance/dependents/...` | Medium |
| 4 | My Profile | `GET/PUT /profile` | Small |
| 5 | My Applications | 7 application endpoints | Large |
| 6 | Status Timeline | `GET /insurance/status/{patientId}` | Small |
| 7 | My Card (full) | 11 card endpoints | Medium |

## ⏳ Wait for Backend (Domain 2)

All 11 sub-features of Domain 2 have **zero backend endpoints**. Mark as "Coming Soon" or build with mock data for design purposes.
