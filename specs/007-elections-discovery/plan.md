# Implementation Plan: Elections Discovery and Details Redesign

**Branch**: `007-elections-discovery` | **Date**: 2026-02-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-elections-discovery/spec.md`

## Summary

Redesign the elections list from a date-based drill-down to a flat, searchable, paginated list (25 items/page, server-side pagination). Add a new "Election Information" tab to the election detail page showing candidates (via Candidates API), eligibility, geographic area, and key dates. Implement intelligent default tab selection (Info when no results, Results when available). Add a candidate detail page at `/candidates/{id}`. Include admin candidate CRUD via shadcn Dialog modals inline on the Election Information tab. Redirect legacy date-based URLs to preserve bookmarks.

## Technical Context

**Language/Version**: TypeScript 5.9+ (strict mode)
**Primary Dependencies**: React 19.2+, TanStack Router (file-based routing, Vite plugin), TanStack Query (data fetching/caching), shadcn/ui (new-york style, neutral base), ky (HTTP client), Zustand (client state), Zod (validation), React Hook Form (admin forms), Lucide React (icons), Sonner (toasts)
**Storage**: N/A (frontend SPA — all data from voter-api at `/api/v1`)
**Testing**: Vitest + React Testing Library (unit, 95% coverage), Playwright (E2E)
**Target Platform**: Browser SPA, deployed to Cloudflare Pages
**Project Type**: Web (frontend SPA only)
**Performance Goals**: Elections list interactive within 2 seconds (SC-006)
**Constraints**: Client-side search only filters current page (server-side search deferred); candidate data requires backend Candidates API to be deployed
**Scale/Scope**: Hundreds of elections, 2-20 candidates per election

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Branch-Based Development | PASS | Work on `007-elections-discovery` branch |
| II. Pull Request Review | PASS | PR will be created when feature is complete |
| III. Test Coverage (95%) | PASS | Unit tests for all new types, API functions, hooks, components; E2E for critical flows |
| IV. Code Quality & Maintainability | PASS | Uses `@/` imports, shadcn/ui, TanStack patterns, TypeScript strict mode |

No violations — no complexity justification needed.

**Design note**: FR-013 (geographic area) renders only `election.district` (string). Richer geographic data (county lists, boundary overlays) would require a boundary lookup or API enhancement and is out of scope for this feature.

## Project Structure

### Documentation (this feature)

```text
specs/007-elections-discovery/
├── plan.md              # This file
├── research.md          # Phase 0 output — research decisions
├── data-model.md        # Phase 1 output — type definitions
├── quickstart.md        # Phase 1 output — developer guide
├── contracts/
│   ├── candidates-api.md    # Candidates CRUD API contract
│   └── elections-api-changes.md  # Election endpoint changes
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── elections.ts          # MODIFY: extend Election, ElectionFilters, UpdateElectionRequest
│   └── candidates.ts         # NEW: CandidateSummary, CandidateDetail, CandidateLink, admin request types
├── lib/
│   ├── api/
│   │   ├── elections.ts      # MODIFY: add new filter params to getElections()
│   │   └── candidates.ts     # NEW: candidate CRUD API functions
│   └── hooks/
│       ├── use-elections.ts       # MODIFY: flat list (no grouping), page_size=25
│       ├── use-election-filters.ts # MODIFY: extend with new filters + search
│       ├── use-candidates.ts      # NEW: useCandidates, useCandidateDetail hooks
│       └── use-admin-candidates.ts # NEW: useCreateCandidate, useUpdateCandidate, useDeleteCandidate, link mutations
├── components/
│   └── elections/
│       ├── ElectionInfoTab.tsx          # NEW: container for info tab sections
│       ├── CandidateList.tsx            # NEW: candidate cards with photo/initials, party, badges
│       ├── CandidateCard.tsx            # NEW: individual candidate display with Avatar
│       ├── ElectionKeyDates.tsx         # NEW: key dates section (hide when all null)
│       ├── ElectionEligibility.tsx      # NEW: eligibility with fallback chain
│       ├── ElectionGeographicArea.tsx   # NEW: district name display (from election.district field)
│       ├── ElectionMetadata.tsx         # NEW: date, type, status display
│       ├── AdminCandidateDialog.tsx     # NEW: shadcn Dialog for create/edit candidate form
│       └── AdminCandidateLinkForm.tsx   # NEW: link management within candidate dialog
├── routes/
│   ├── elections/
│   │   ├── index.tsx                    # REWRITE: flat searchable list, 25/page
│   │   ├── $electionId.tsx              # NEW: direct detail route with 3 tabs
│   │   ├── $electionDate.tsx            # MODIFY: redirect to /elections/ or /elections/$id
│   │   ├── $electionDate/
│   │   │   ├── index.tsx                # MODIFY: redirect to /elections/
│   │   │   └── $electionId.tsx          # MODIFY: redirect to /elections/$electionId
│   └── candidates/
│       └── $candidateId.tsx             # NEW: candidate detail page
├── test/
│   └── mocks/
│       └── candidates.ts               # NEW: mock factories for candidate test data

tests/
├── types/
│   └── candidates.test.ts              # NEW: type validation tests
├── lib/
│   ├── api/
│   │   └── candidates.test.ts          # NEW: API function tests
│   └── hooks/
│       ├── use-candidates.test.ts       # NEW: hook tests
│       └── use-admin-candidates.test.ts # NEW: admin mutation hook tests
├── components/
│   └── elections/
│       ├── ElectionInfoTab.test.tsx     # NEW
│       ├── CandidateList.test.tsx       # NEW
│       ├── ElectionKeyDates.test.tsx    # NEW
│       ├── ElectionEligibility.test.tsx # NEW
│       ├── ElectionGeographicArea.test.tsx # NEW
│       └── AdminCandidateDialog.test.tsx # NEW
└── routes/
    └── elections/
        ├── elections-list.test.tsx       # NEW or UPDATE
        └── election-detail.test.tsx     # NEW

e2e/
├── fixtures/
│   ├── mock-data.ts                     # MODIFY: add candidate mock data, election metadata
│   └── election-api.ts                  # MODIFY: add candidate API route intercepts
├── elections-list.spec.ts               # NEW: list page E2E tests
├── election-info-tab.spec.ts            # NEW: info tab E2E tests
└── candidate-detail.spec.ts             # NEW: candidate detail E2E tests
```

**Structure Decision**: Frontend SPA — all code lives under `src/` with TanStack Router file-based routing. No backend code in this repo. The new `src/routes/candidates/` directory is a top-level route for candidate detail pages, following the existing URL pattern (`/candidates/{id}`).

## Complexity Tracking

No violations to justify. The implementation follows existing project patterns (TanStack Router file-based routing, TanStack Query hooks, shadcn/ui Dialog for admin CRUD, Zustand for client state).
