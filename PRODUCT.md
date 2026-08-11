# PRODUCT.md

## Register
**Brand** — the public home page is a portal entry: design IS the first
impression for citizens. The authenticated app (dashboard, forms) is product
register and is treated as such per-task.

## Users & Purpose
- **Primary users**: Egyptian citizens using the government health insurance
  system (التأمين الصحي) — mixed ages, mixed technical comfort.
- **Secondary users**: ministry staff and administrators.
- **Purpose**: give citizens a trustworthy, official entry point: brand,
  identity, and the two actions that matter — login (existing accounts) and
  register (new accounts). Nothing more.
- **Emotion to evoke**: calm confidence. Bureaucratic anxiety is the baseline;
  the interface must feel solid, formal, and frictionless.

## Brand Personality
**Official, calm, trustworthy.** Formal government-institution tone: restrained
color use, clear hierarchy, no marketing gimmicks, no playful copy.

## Anti-References
- Flashy SaaS landing pages (gradient heroes, big stats, card grids)
- Startup-style playful copy or emoji
- Anything that reads as an ad rather than a public service
- The default create-next-app boilerplate that currently ships on `/`

## Accessibility & Internationalization
- WCAG AA contrast at minimum; Arabic (RTL) and English (LTR) both first-class
- Dark mode supported via existing tokens
- Mixed-ability, mixed-age audience: generous hit targets, clear labels

## Strategic Design Principles
1. Restraint is the brand: minimal sections, maximal clarity.
2. Blue primary identity (oklch(0.5 0.134 242.749)) stays; never mutate tokens.
3. The page must be understood in under 5 seconds: who this is and what to do.
4. No motion unless it clarifies; respect `prefers-reduced-motion`.
