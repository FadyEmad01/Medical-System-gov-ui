## Summary

<!-- 1–3 bullets: what changed and why (not a file list). -->

-

## Context

<!-- Optional: linked issue, related PR, or backend contract change. -->

- Issue / ticket:
- OpenAPI / swagger impact: <!-- none | citezen | doctor | admin -->

## Type of change

<!-- Check all that apply. -->

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor (no intentional behavior change)
- [ ] Docs / chore
- [ ] Security / auth / session handling

## Test plan

<!-- Concrete steps a reviewer can run. Include roles and locales when relevant. -->

- [ ]
- [ ]

### Roles to verify

- [ ] Citizen (Patient)
- [ ] Doctor
- [ ] Admin
- [ ] N/A (docs / pure refactor)

### Locales

- [ ] `ar` (RTL)
- [ ] `en` (LTR)
- [ ] N/A

## Checklist

- [ ] Pages stay thin; logic lives in the owning `src/features/*` module
- [ ] Server actions return `ActionResult<T>` (no thrown errors across the boundary)
- [ ] Untrusted input parsed/normalized at the action boundary (`lib/parse-*` when applicable)
- [ ] Errors branch on `ApiError` / `AuthActionError` `kind` (not raw status codes)
- [ ] Session expiry clears cookie + purges identity / role PII caches (`purgeSessionCaches`)
- [ ] Query keys are stable; mutations invalidate the right scopes
- [ ] Loading / empty / error / success (and disabled submit) states covered in UI
- [ ] No secrets, tokens, or `.env.local` committed
- [ ] Did not invent API endpoints or fields outside swagger
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npx tsc --noEmit` passes (if types changed)

## Screenshots / recordings

<!-- Required for user-visible UI. Optional for pure refactors. -->

| Before | After |
| --- | --- |
| | |

## Notes / risks

<!-- Migrations, feature flags, follow-ups, known gaps. -->

-
