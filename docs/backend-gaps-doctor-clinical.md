# Clinical API — discovery record & remaining asks

> **To:** Backend team · **From:** Frontend (doctor portal) · **Updated:** 2026-08-28
>
> **Great news — we probed staging with a real Doctor token and the clinical
> endpoints are LIVE.** The `doctor-swagger.json` checked into the repo is
> stale (it contains only auth + insurance point-of-care paths), which is why
> the frontend originally treated this domain as pending. The doctor workspace
> is now fully wired against the live contract below. Two asks remain at the
> bottom.

## 1. Live contract (probed 2026-08-28, Dr token)

### GET /patients/search?nationalId=
`200` → `{ id, nationalId, fullName, dateOfBirth, gender ("Male"|"Female"), mobileNumber }`
Scoped: `404 "No patient found with this NationalId."` when the doctor has no
visit/assignment relationship with the patient (matches the 404-privacy rule).

### GET /doctors/{doctorId}/patients
`200` → `[{ patientId, fullName, nationalId, mobileNumber, assignedAt }]`
(`assignedAt: null` ⇒ visit-derived).

### GET /patients/{patientId}/medical-summary
`200` → `{ patientId, fullName, nationalId, dateOfBirth, gender, lastVisit: { visitId, visitDate, doctorName, visitType } | null, latestDiagnosis, latestNotes, latestRequiredTests, latestMedications: [{ medicationName, dosage }], latestAttachments: [{ attachmentId, fileName, fileType, uploadedAt }] }`
`404` also covers "no visits yet" (frontend maps it to a neutral empty state).

### GET /patients/{patientId}/visit-history
`200` → `[{ visitId, visitDate, doctorId, doctorName, visitType, diagnosisSummary }]`
(flat rows, no status field).

### GET /visits/{id} · POST /visits · PUT /visits/{id} · PATCH /visits/{id}/status
Visit shape: `{ id (GUID), patientId, patientFullName, patientNationalId, doctorId, doctorFullName, visitDate (datetime, accepts YYYY-MM-DD), visitType ("Consultation"|"FollowUp"|"Emergency"), status ("Scheduled"|"InProgress"|"Completed"|"Cancelled"), notes, diagnosis, requiredTests, createdAt, medications[], attachments[] }`.
All writes return the updated visit. PUT confirmed full-replace of
diagnosis/notes/requiredTests. Status machine enforced server-side.

### POST /visits/{id}/medications
Batch body: `{ "medications": [{ medicineName, dosage, frequency, duration }] }`
→ updated visit. (Single-row unwrapped body `400`s with
`"At least one medication must be provided."`)

### POST /visits/{visitId}/attachments (multipart `file`) · GET /visits/{visitId}/attachments · GET /attachments/{id}
Attachment: `{ id, visitId?, fileName, fileUrl, fileType, fileSize, uploadedBy?, uploadedAt }`
— `fileUrl` is a direct Cloudinary link (uploads return `201` without
`visitId`/`uploadedBy`; `GET /attachments/{id}` returns metadata JSON, not the
binary). Medical-summary attachments use `attachmentId` instead of `id`.

## 2. E2E verified through the UI

Register test citizen → doctor searches by NID → chart (summary, visit
history) → visit detail → status `Scheduled→InProgress→Completed` (closed-visit
banners appear, actions hide) → medication add → attachment upload/link →
record insurance verification → snapshot/history refresh. All against staging,
in `en` + `ar`.

## 3. Remaining asks (minor)

1. **Swagger export** — drop the updated `doctor-swagger.json` (with the
   clinical paths) into the repo root so the contract stops living in this doc.
2. **Naming consistency** — `id` vs `visitId` vs `attachmentId`, and
   `fileType` vs `contentType`, differ between endpoints. Not blocking, but if
   a breaking-change window ever opens, aligning them would simplify the
   frontend types.
3. **Field length limits & verification TTL** — visit
   diagnosis/notes/requiredTests and medication fields have no documented
   maxima; the frontend temporarily enforces 2000/5000/2000/200·100·100·100.
   Also, a verification recorded on staging expired ~21h later, not the
   documented default 24h — confirm the deployed
   `Insurance:Verification:DefaultValidityHours`. Confirm or correct both.
4. **Doctor identity** — confirmed working via `userId == doctorId` on staging
   (`/auth/me` → `userId` 4 works as `{doctorId}` in roster paths). Worth
   documenting as a guarantee, or add an explicit doctor claim.
