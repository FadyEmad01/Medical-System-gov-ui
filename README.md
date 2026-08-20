<p align="center">
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='5' fill='%230b6aa8'/%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill='white'/%3E%3C/svg%3E" width="96" alt="Health Insurance logo" />
</p>

<h1 align="center">Medical System Gov UI</h1>

<p align="center">
  Bilingual (Arabic-first, RTL / English) web portal for Egypt's national health insurance system.<br />
  التأمين الصحي — بوابة المواطن والممارس والإداري
</p>

<p align="center">
  <a href="https://nextjs.org"><img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs"></a>
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white">
  <img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=black">
  <img alt="Biome" src="https://img.shields.io/badge/Lint-Biome-60a5fa?logo=biome&logoColor=black">
  <img alt="Vitest" src="https://img.shields.io/badge/Tests-Vitest-6e9f18?logo=vitest">
</p>

## Overview

This repository contains the **frontend** of a government health-insurance platform. It is a Next.js App Router application that talks to a .NET backend (see the OpenAPI contracts in the repo root) and serves three roles from a single codebase:

| Role | What they can do |
| --- | --- |
| **Citizen** | Register with a multi-step form, complete a profile, add dependents, browse insurance categories, apply for enrollment with document uploads, track application status, and view their digital insurance card. |
| **Doctor** | Point-of-care workspace: scan a patient's insurance card, check coverage eligibility, record verification decisions, and review decision history. |
| **Admin** | Manage insurance categories and requirements, work the application review queue, control the card lifecycle (issue / suspend / revoke / renew), and verify cards. |

The UI is designed to feel official, calm, and trustworthy (see [PRODUCT.md](PRODUCT.md) for the design register) — WCAG AA contrast, Arabic-first with full RTL support, and English as a first-class second locale.

## Key routes

| Route | Purpose |
| --- | --- |
| `/` | Public portal landing (login / register) |
| `/auth/register` | Multi-step citizen registration |
| `/dashboard` | Patient home: status cards and quick actions |
| `/dashboard/insurance` | Insurance categories landing |
| `/dashboard/insurance/apply` | Enrollment wizard (profile, dependents, documents, review) |
| `/dashboard/insurance/track` | Application status tracking |
| `/dashboard/insurance-card` | Digital insurance card with status and history |
| `/dashboard/profile` | Profile details, editing, and completeness |
| `/dashboard/doctor` | Doctor point-of-care workspace |
| `/dashboard/admin` | Admin hub |
| `/dashboard/admin/applications` | Review queue and per-application decision |
| `/dashboard/admin/categories` | Insurance category and requirement management |
| `/dashboard/admin/cards` | Card lifecycle management per patient |
| `/dashboard/admin/verification` | Card verification desk |

> [!NOTE]
> `/dashboard/appointments` is intentionally a "coming soon" stub — the backend does not implement scheduling yet.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions, React Compiler enabled) |
| UI | React 19, shadcn/ui primitives (Radix), Tailwind CSS v4 (CSS-first tokens in `src/styles/globals.css`), `motion` for animation |
| i18n | `next-intl` — `ar` (default, RTL) and `en`, locale always prefixed |
| Data fetching | TanStack Query on the client; a typed `ApiClient` + Server Actions on the server |
| Forms & validation | `react-hook-form` + `zod` schemas shared by client forms and server action inputs |
| Charts | Recharts |
| Code quality | Biome (lint + format), TypeScript strict mode |
| Testing | Vitest (unit tests for pure feature logic) |

## Architecture

The app uses **feature-based (vertical-slice) architecture**: each domain owns everything it needs, and app-router pages stay thin.

```text
src/
├── app/[locale]/        # Routes only — thin wrappers that delegate to features
├── components/          # Cross-cutting UI: 29 shadcn primitives, guards, language switcher
├── features/
│   ├── auth/            # Session, login/register, QueryProvider, server actions
│   ├── dashboard/       # Shell: sidebar, header, patient home
│   ├── doctor/          # Point-of-care workspace
│   ├── insurance/       # Largest feature:
│   │   ├── enrollment/  #   wizard steps, dependents, document upload
│   │   ├── card/        #   digital card UI
│   │   ├── profile/     #   profile pages and completeness
│   │   ├── verification/
│   │   └── admin/       #   review queue, categories, card lifecycle, verification
│   └── */translations/  # ar.json + en.json per feature
├── i18n/                # next-intl routing, request-time message merging
├── lib/                 # ApiClient, zod-validated env, ProblemDetails parsing
├── styles/              # Tailwind v4 theme tokens (globals.css)
└── proxy.ts             # Next.js middleware: auth-cookie gate + locale negotiation
```

A typical feature module bundles `components/`, `hooks/`, `lib/` (pure, unit-tested logic), `api/` (typed backend clients), `validation/` (zod schemas), `actions.ts` (server actions), `types.ts`, and `translations/{ar,en}.json`.

### Rendering pipeline

A request passes through three gates before a page renders:

1. **`src/proxy.ts`** — Next.js 16 middleware: negotiates the locale and redirects logged-out users away from `/dashboard`.
2. **`AuthGuard`** — mounted in the dashboard layout; verifies the session cookie and redirects on expiry.
3. **Role guards** (`DoctorGuard`, `AdminGuard`, `PatientGuard`, `StaffGuard`) — wrap role-specific pages. These are UI-only; the backend remains the source of truth for authorization, guards merely hide content the current role cannot use.

### Data flow

All backend traffic goes through one funnel. Client components read through TanStack Query hooks that call **server actions** (`"use server"`), which parse their input, read the session cookie, invoke a typed feature API client, and return a result object. The shared `ApiClient` (`src/lib/api-client.ts`) attaches the bearer token, applies a 15-second timeout, and converts every failure into a typed `ApiError`.

```mermaid
flowchart LR
  UI["Client component"] --> Q["TanStack Query hook"]
  Q --> SA["Server action — parses input, reads session"]
  SA --> AC["Feature API client"]
  AC --> API["ApiClient — bearer, timeout, ProblemDetails"]
  API --> BE[(".NET backend")]
```

Business rules that must not break (wizard step derivation, card status transitions, queue filters, file validation…) live in plain functions under each feature's `lib/`, covered by co-located `*.test.ts` files.

> [!IMPORTANT]
> Arabic is the default locale and every layout renders RTL. When adding UI, use logical CSS properties and test in both `ar` and `en` — the shadcn primitives in `src/components/ui` are already RTL-aware.

## Patterns in use

The conventions every feature follows — worth knowing before opening a PR:

| Pattern | How it's applied |
| --- | --- |
| **Result-type server actions** | Every `actions.ts` returns `ActionResult<T>` — `{ ok: true, data }` or `{ ok: false, error }` — so errors cross the server/client boundary as values, never as exceptions. |
| **Parse at the boundary** | Action inputs are validated with zod and normalized (trimmed, empty → `null`) before any network call; the same schemas drive the client-side forms. |
| **Discriminated API errors** | `ApiError.kind` (`validation`, `conflict`, `unauthorized`, `forbidden`, `notFound`, `server`, `timeout`, `network`) is mapped from the HTTP status and RFC 7807 `ProblemDetails`; callers branch on `kind`, never on status codes. |
| **Session-aware errors** | A missing or expired session clears the cookie and returns a localized `SESSION_EXPIRED_ERROR`; query hooks then drop the identity cache so `AuthGuard` redirects on the next render. |
| **Query hooks over actions** | `use-*.ts` hooks normalize action results to throws (`if (!res.ok) throw res.error`), use factory query keys, skip retries for deterministic failures, and handle session expiry in an effect (TanStack Query v5 removed query-level `onError`). |
| **Server errors → form fields** | `applyActionError` maps `fieldErrors` onto react-hook-form fields (ProblemDetails keys are normalized to camelCase so they line up with schema names), with a root-level fallback so a failure is never silent. |
| **Pure logic, co-located tests** | Business rules live in plain functions in each feature's `lib/`, with `*.test.ts` files right next to them — no snapshot or DOM tests, just the logic. |
| **Server-only enforcement** | `ApiClient` and the env module import `server-only`, making it a build error to pull them into a client bundle. |
| **Per-feature i18n** | Each feature ships its own `translations/ar.json` + `en.json`; `src/i18n/request.ts` lazily loads and merges them into namespaces per request. |
| **Token-driven theming** | Tailwind v4 CSS-first tokens in `src/styles/globals.css`, including semantic status colors (`success`, `warning`, `info`, `revoked`, `superseded`) reused across features. |

To see these working together, read `src/features/insurance/actions.ts` and `src/features/insurance/hooks/use-card.ts` end to end.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 20.9 or later
- npm (a `package-lock.json` is committed)

### Setup

```bash
npm install
cp .env.example .env.local   # then edit values as needed
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000) (redirecting to `/ar` by default).

### Environment variables

Validated at runtime with zod in `src/lib/env.ts` — the app fails fast on missing or malformed values.

| Variable | Required | Description |
| --- | --- | --- |
| `API_BASE_URL` | Yes | Base URL of the backend API, without a trailing slash (e.g. `http://stg-api.runasp.net/api`). |
| `APP_BASE_URL` | Yes in production | Absolute URL the app is served from, without a trailing slash; used for redirect targets. Optional in development. |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint with Biome (`biome check`) |
| `npm run format` | Auto-format with Biome |
| `npm run test` | Run the Vitest unit-test suite |

## Testing

Vitest runs unit tests for the pure feature logic (`src/**/*.test.ts`, node environment, `@` alias configured in `vitest.config.mts`). Coverage focuses on the rules that would be dangerous to get wrong: wizard step derivation, card status transitions, review-queue filters, document file validation, and ProblemDetails parsing. Component and E2E tests are not set up yet.

## Working with the backend

The OpenAPI contracts this UI is built against ship in the repo root: `citezen-swagger.json`, `doctor-swagger.json`, and `admin-swagger.json`. For endpoint-by-endpoint mapping, flow diagrams, and role details, see:

- [frontend-integration-guide.md](frontend-integration-guide.md) — full backend contract reference
- [docs/domains.md](docs/domains.md) — domain walkthroughs with UI flow diagrams
- [docs/](docs) — per-area plans (review queue, categories, card lifecycle) and design prototypes

> [!TIP]
> This project runs **Next.js 16**, which differs from earlier versions in several conventions (e.g. `proxy.ts` instead of `middleware.ts`). Read [AGENTS.md](AGENTS.md) before making framework-level changes.
