# Doctor UI — swagger map & direction

Source: `doctor-swagger.json` (OpenAPI 3.0.4, “Doctor / Point of Care API” v1).

## What the BE actually shipped

| Method | Path | Role | UI use |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | any | Shared login |
| GET | `/api/auth/me` | any | Session / role gate |
| POST | `/api/auth/test-token` | Dev only | **Skip in FE** |
| POST | `/api/insurance/cards/verify` | Doctor + Admin | Scan QR/NFC → accept/deny |
| GET | `/api/insurance/eligibility/{patientId}` | Doctor / Patient (scoped) | Read-only eligibility chip |
| POST | `/api/insurance/verification/verify` | Doctor + Admin | Record coverage decision |
| GET | `/api/insurance/verification/current/{patientId}` | Doctor / Patient | “Usable right now?” gate |
| GET | `/api/insurance/verification/{patientId}/latest` | Doctor / Patient | Last event (even if expired) |
| GET | `/api/insurance/verification/{patientId}/history` | Doctor / Patient | Trail, newest first |

**Info description vs paths:** the swagger *blurb* mentions patient search, medical summary, visits, medications, attachments — **none of those paths exist in this file yet**. Doctor UI v1 should not invent them.

## Screen map (honest v1)

```
Login (shared)
  → Doctor home: Point of care
       ├─ Scan card          (token → CardVerificationResultDto)
       ├─ Bind patient       (patientId input — no search API yet)
       ├─ Coverage snapshot  (eligibility + current + latest)
       ├─ Record verification (status + context + reason [+ remarks])
       └─ History            (verification history table)
```

**Product gap to watch:** card verify returns holder name / card number / validity — **not** `patientId`. Binding a patient for eligibility/verification needs a numeric patient ID (or a future search/assignment API).

**Access rule for doctors:** eligibility + verification reads only for patients they already visited or are assigned to; inaccessible ≈ 404.

## Prototypes

Both variants use **`theme.css`** — the same OKLCH tokens as `src/styles/globals.css` (primary / muted / success / warning / destructive / sidebar / radius) plus Inter + Geist Mono.

| File | Layout direction |
| --- | --- |
| [`variant-a-clinical-desk.html`](./variant-a-clinical-desk.html) | Multi-column workstation; dashboard sidebar shell |
| [`variant-b-scan-first-lane.html`](./variant-b-scan-first-lane.html) | Scan-first stepped lane; large Accept/Deny result board |

Open via local static server (Tailwind CDN). Example:

```bash
npx serve docs/doctor-ui-prototypes -p 4173
```

## Recommendation

- Prefer **Variant A** if doctors work from a desk with a known patient open (chart-like).
- Prefer **Variant B** if the primary job is queue check-in / scanning volume.

Reuse existing Admin verification components where possible; keep Doctor on the shared design system.
