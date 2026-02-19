# Implementation Plan: Voter Search & Geocoding

**Branch**: `003-voter-search-geocoding` | **Date**: 2026-02-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-voter-search-geocoding/spec.md`

## Summary

Add a voter search & geocoding feature to the voter-web SPA. Staff can search for voters by name with filters (county, status, district), view voter detail pages with registration info, geocoded locations displayed on a map and in a table, and district assignments. Admins/analysts can trigger geocoding, select official locations, and remove stale locations. All search state is URL-driven for bookmarking and sharing. A top-level "Voters" nav item is added for all authenticated users.

## Technical Context

**Language/Version**: TypeScript 5.9+, React 19.2+
**Primary Dependencies**: TanStack Router (file-based routing), TanStack Query (data fetching), React-Leaflet + Leaflet (map), shadcn/ui (UI components), Zustand (auth state), ky (HTTP client), React Hook Form + Zod (forms/validation), Sonner (toasts), Lucide React (icons)
**Storage**: N/A (frontend SPA — all data from voter-api backend at `/api/v1`)
**Testing**: Vitest + React Testing Library (unit), Playwright (E2E); 95% coverage threshold
**Target Platform**: Web (modern browsers), deployed as static SPA to Cloudflare Pages
**Project Type**: Single SPA (frontend only)
**Performance Goals**: Search results in <2s, filter/sort updates in <1s, district refresh in <2s (per SC-001 through SC-005)
**Constraints**: Must use existing auth system, must follow existing patterns (TanStack Router, TanStack Query, shadcn/ui), debounced search input
**Scale/Scope**: ~4 new route files, ~8 new components, ~1 new API module, ~1 new types file, ~1 new hooks file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Branch-Based Development | PASS | Feature branch `003-voter-search-geocoding` created from `main` before any code changes |
| II. Pull Request Review | PASS | Will merge via PR with review when implementation is complete |
| III. Test Coverage (95%) | PASS | Plan includes unit tests for all new components, hooks, and API functions; E2E tests for critical flows |
| IV. Code Quality & Maintainability | PASS | Uses `@/` imports, TypeScript strict mode, shadcn/ui, established TanStack patterns, ESLint |

No violations. No complexity justifications needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-voter-search-geocoding/
├── plan.md              # This file
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Entity definitions
├── quickstart.md        # Phase 1: Getting started guide
├── contracts/           # Phase 1: API contracts
│   └── voter-api.md     # Frontend-backend API contract
└── tasks.md             # Phase 2: Task breakdown (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── api/
│   └── voters.ts                         # NEW: Voter API wrapper functions
├── types/
│   └── voter.ts                          # NEW: Voter search, detail, filter types
├── hooks/
│   └── useVoters.ts                      # NEW: TanStack Query hooks for voter search & geocoding
├── routes/
│   ├── voters.tsx                        # NEW: Voters layout (auth guard)
│   └── voters/
│       ├── index.tsx                     # NEW: Voter search page (/voters)
│       ├── $voterId.tsx                  # NEW: Voter detail page (/voters/{id})
│       └── _components/
│           ├── VoterSearchFilters.tsx    # NEW: County, status, district cascade filters
│           ├── VoterTable.tsx            # NEW: Sortable, paginated results table
│           ├── VoterRegistrationCard.tsx # NEW: Registration info card
│           ├── GeocodedLocationsCard.tsx # NEW: Locations list with actions
│           ├── GeocodedLocationMap.tsx   # NEW: Leaflet map with location pins
│           └── DistrictAssignmentsCard.tsx # NEW: District list card
└── routes/__root.tsx                     # MODIFIED: Add "Voters" nav item

tests/
├── api/
│   └── voters.test.ts                   # NEW: API function tests
├── hooks/
│   └── useVoters.test.ts                # NEW: Hook tests
├── routes/voters/
│   ├── index.test.tsx                   # NEW: Search page tests
│   ├── voter-detail.test.tsx            # NEW: Detail page tests
│   └── _components/
│       ├── VoterSearchFilters.test.tsx   # NEW: Filter component tests
│       ├── VoterTable.test.tsx           # NEW: Table component tests
│       ├── VoterRegistrationCard.test.tsx # NEW
│       ├── GeocodedLocationsCard.test.tsx # NEW
│       ├── GeocodedLocationMap.test.tsx   # NEW
│       └── DistrictAssignmentsCard.test.tsx # NEW

e2e/
├── voter-search.spec.ts                 # NEW: Search E2E tests
├── voter-detail.spec.ts                 # NEW: Detail page E2E tests
└── fixtures/
    └── voter-api.ts                     # NEW: Voter API mock fixture
```

**Structure Decision**: Follows the existing SPA structure — new API wrappers in `src/api/`, types in `src/types/`, hooks in `src/hooks/`, and route components in `src/routes/voters/` with feature-specific components in `_components/`. Tests mirror `src/` structure in `tests/`.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
