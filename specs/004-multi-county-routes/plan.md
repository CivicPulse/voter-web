# Implementation Plan: Multi-State & Multi-County URL Routing

**Branch**: `004-multi-county-routes` | **Date**: 2026-02-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-multi-county-routes/spec.md`

## Summary

Restructure the voter-web URL routing to support multiple states and counties without data collisions. The core approach is to add new route files at different path segment depths (leveraging TanStack Router's segment-count-based disambiguation) while keeping all existing routes as backward-compatible legacy entry points. No new backend API endpoints are required — available states and district scope are derived client-side from existing boundary GeoJSON data.

## Technical Context

**Language/Version**: TypeScript 5.9+, React 19.2+
**Primary Dependencies**: TanStack Router (file-based routing, Vite plugin), TanStack Query (data fetching/caching), React-Leaflet + Leaflet (maps), Vite 7, shadcn/ui (UI components), ky (HTTP client), Zustand (auth state), Zod (validation), vaul (drawer), Turf.js (geo operations)
**Storage**: N/A (frontend SPA — all data from voter-api at `/api/v1`)
**Testing**: Vitest (unit, 95% coverage threshold), Playwright (E2E against `vite preview`)
**Target Platform**: Web SPA deployed to Cloudflare Pages
**Project Type**: Single web application (React SPA)
**Performance Goals**: SC-006 — page load within 20% of current times despite added URL resolution
**Constraints**: File-based routing (route = file); backward-compatible legacy URLs; SPA with client-side routing only (no server-side redirects); static GeoJSON cache at build time (20MB limit per file)
**Scale/Scope**: Initially 2-5 states; up to 50 states long-term; hundreds of counties per state

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Branch-Based Development | ✅ Pass | Working on `004-multi-county-routes` branch |
| II. Pull Request Review | ✅ Pass | PR will be created after implementation |
| III. Test Coverage (95%) | ✅ Pass | Plan includes unit tests for all new hooks, slug utilities, route components, and disambiguation logic |
| IV. Code Quality & Maintainability | ✅ Pass | Uses established patterns (TanStack Router file-based routes, TanStack Query hooks, `@/` imports, shadcn/ui, Zod) |

No violations. No complexity justification needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-multi-county-routes/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — routing research & decisions
├── data-model.md        # Phase 1 — types and data flow
├── quickstart.md        # Phase 1 — implementation sequence
├── contracts/           # Phase 1 — route contracts & API surface
│   └── routes.md        # Route definitions and param contracts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── routes/
│   ├── __root.tsx                         # MODIFY — update route matching for new routes
│   ├── index.tsx                          # MODIFY — dynamic state selection / auto-redirect
│   ├── $state.tsx                         # NEW — state detail page (e.g., /ga)
│   ├── counties/
│   │   ├── $countyId.tsx                  # MODIFY — legacy UUID redirect to slug URL
│   │   └── $state/
│   │       └── $county.tsx                # KEEP — already correct pattern
│   └── districts/
│       ├── $districtId.tsx                # KEEP — UUID backward compat (no change)
│       ├── $type/
│       │   └── $name.tsx                  # MODIFY — legacy slug redirect/disambiguation
│       ├── $state/
│       │   └── $type/
│       │       └── $name.tsx              # NEW — state-level district (3 params)
│       └── $state/
│           └── $county/
│               └── $type/
│                   └── $name.tsx          # NEW — county-level district (4 params)
├── components/
│   ├── StateCountyMap.tsx                 # NEW (rename from GeorgiaCountyMap.tsx)
│   ├── CountyDetailMap.tsx                # MODIFY — remove GA_CENTER hardcoding
│   ├── DistrictDetailMap.tsx              # MODIFY — remove GA_CENTER hardcoding
│   ├── DistrictDetailContent.tsx          # MODIFY — add state/county context to links
│   ├── CountyDetailContent.tsx            # MODIFY — add state context to district links
│   ├── StateSelectionPage.tsx             # NEW — multi-state landing page
│   └── DisambiguationPage.tsx             # NEW — legacy URL collision resolution
├── hooks/
│   ├── useAvailableStates.ts              # NEW — derive states from county boundaries
│   ├── useDistrictSlugResolver.ts         # MODIFY — add state/county params
│   └── useCountySlugResolver.ts           # KEEP — already multi-state capable
├── lib/
│   ├── slugs.ts                           # MODIFY — update districtSlugPath()
│   ├── states.ts                          # KEEP — already has all 50 states
│   └── geo.ts                             # KEEP — already generic
└── test/
    └── (corresponding test files)

tests/
├── hooks/
│   ├── useAvailableStates.test.ts         # NEW
│   └── useDistrictSlugResolver.test.ts    # MODIFY
├── lib/
│   └── slugs.test.ts                      # MODIFY
└── components/
    └── DisambiguationPage.test.ts         # NEW

e2e/
├── multi-state-navigation.spec.ts         # NEW
└── legacy-url-compat.spec.ts              # NEW
```

**Structure Decision**: Single web application (existing structure). New route files follow TanStack Router's file-based convention. Components follow the existing pattern of shared components in `src/components/` and route-specific components in `src/routes/*/_components/`.

## Complexity Tracking

No violations — no entries needed.
