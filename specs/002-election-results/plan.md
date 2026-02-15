# Implementation Plan: Live Election Results Visualization

**Branch**: `002-election-results` | **Date**: 2026-02-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-election-results/spec.md`

## Summary

Add a complete election results visualization feature to voter-web. This includes a public-facing election browsing experience with multi-race support (Elections list → Race list → Race results), choropleth county/precinct maps with multiple data layers, a results drawer with collapsible vote method breakdowns, live auto-refresh for active elections, and admin CRUD for election management. The feature follows established patterns (TanStack Router file-based routes, TanStack Query for data fetching/polling, vaul drawer, React-Leaflet maps, Zustand for client state) and adds new routes at `/elections/*` and `/admin/elections/*`.

## Technical Context

**Language/Version**: TypeScript 5.9+, React 19.2+
**Primary Dependencies**: TanStack Router (file-based routing), TanStack Query (data fetching, caching, polling), React-Leaflet + Leaflet (maps), vaul (drawer), Recharts (charts if needed), Zustand (client state), ky (HTTP client), React Hook Form + Zod (admin forms), shadcn/ui (UI components), Lucide React (icons), Sonner (toasts)
**Storage**: N/A (frontend SPA — all data from voter-api backend at `/api/v1`)
**Testing**: Vitest (configured in devDeps, no tests written yet), Playwright (UI verification via MCP)
**Target Platform**: Web SPA, deployed to Cloudflare Pages
**Project Type**: Web (frontend SPA only — backend is separate voter-api project)
**Performance Goals**: Map renders in <3s (SC-002), view switching <2s (SC-006), auto-refresh within configured interval (SC-005), election discovery <15s (SC-001)
**Constraints**: SPA deployment on Cloudflare Pages, public results (no auth required for viewing), precinct GeoJSON potentially large (on-demand fetch with county filter), 95% unit test coverage (constitution)
**Scale/Scope**: Elections with 50+ races, 159 Georgia counties, variable precincts per county, desktop + mobile responsive

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Branch-Based Development | ✅ PASS | Already on branch `002-election-results` created from `main` |
| II. Pull Request Review | ✅ PASS | Will create PR against `main` when feature is complete |
| III. Test Coverage (95%) | ⚠️ CONDITIONAL | Vitest is installed but no test infrastructure exists yet. Tests must be written for all new code. Test setup task required as part of implementation. |
| IV. Code Quality & Maintainability | ✅ PASS | Will follow existing patterns: `@/` imports, TypeScript strict mode, ESLint, shadcn/ui, TanStack Router/Query, Zustand |

**Gate Decision**: PASS with condition — test infrastructure must be established as part of this feature's implementation to meet the 95% coverage requirement.

## Project Structure

### Documentation (this feature)

```text
specs/002-election-results/
├── plan.md              # This file
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: TypeScript types and entity model
├── quickstart.md        # Phase 1: Developer quickstart guide
├── contracts/           # Phase 1: API contract documentation
│   └── elections-api.md # Election API endpoint contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── routes/
│   ├── elections.tsx                          # Elections layout route
│   ├── elections/
│   │   ├── index.tsx                         # Elections list page (/elections) — grouped by date
│   │   ├── $electionDate.tsx                 # Election event layout (date-based grouping)
│   │   └── $electionDate/
│   │       ├── index.tsx                     # Race list page (/elections/2026-02-17)
│   │       ├── $electionId.tsx               # Race results page (/elections/2026-02-17/$electionId)
│   │       └── _components/
│   │           ├── race-list.tsx             # Race list with search + category filter
│   │           └── race-list-item.tsx        # Individual race card
│   └── admin/
│       └── elections/
│           ├── index.tsx                     # Admin elections list (/admin/elections)
│           ├── create.tsx                    # Admin create election form
│           ├── $electionId.tsx               # Admin election detail/edit
│           └── _components/
│               ├── election-table.tsx        # Admin elections data table
│               ├── election-form.tsx         # Create/edit form component
│               └── election-confirm-dialog.tsx # Two-step confirmation
├── components/
│   ├── elections/
│   │   ├── ElectionResultsMap.tsx            # Choropleth map for race results
│   │   ├── ElectionResultsDrawer.tsx         # Results drawer (vaul)
│   │   ├── CandidateResultRow.tsx            # Candidate with collapsible vote methods
│   │   ├── CountyResultsPanel.tsx            # County-specific results in drawer
│   │   ├── MapLayerSelector.tsx              # Data layer toggle (lead/reporting/votes)
│   │   ├── CertificationBadge.tsx            # Unofficial/Official results badge
│   │   ├── LiveStatusIndicator.tsx           # Last refresh + live/final indicator
│   │   └── PrecinctMapView.tsx               # Precinct overlay with county filter
│   └── ui/                                   # (existing shadcn components)
├── lib/
│   ├── api/
│   │   └── elections.ts                      # Election API client functions
│   └── hooks/
│       ├── use-elections.ts                  # Elections list query hook
│       ├── use-election-detail.ts            # Election detail + races query hook
│       ├── use-race-results.ts               # Race results query hook (with auto-refresh)
│       ├── use-race-geojson.ts               # County/precinct GeoJSON hooks
│       ├── use-admin-elections.ts            # Admin election CRUD hooks
│       └── use-election-filters.ts           # Client-side filter state
├── types/
│   └── elections.ts                          # All election/race/result TypeScript types
└── hooks/
    └── (existing hooks)

tests/
├── setup.ts                                  # Vitest setup
├── lib/
│   ├── api/
│   │   └── elections.test.ts                 # API client unit tests
│   └── hooks/
│       ├── use-elections.test.ts             # Hook tests
│       ├── use-race-results.test.ts          # Auto-refresh logic tests
│       └── use-admin-elections.test.ts       # Admin hook tests
├── components/
│   └── elections/
│       ├── CandidateResultRow.test.tsx       # Component tests
│       ├── CertificationBadge.test.tsx       # Badge rendering tests
│       └── MapLayerSelector.test.tsx         # Layer selector tests
└── types/
    └── elections.test.ts                     # Type guard / utility tests
```

**Structure Decision**: Frontend SPA — follows existing voter-web patterns. New election routes under `src/routes/elections/` (public) and `src/routes/admin/elections/` (admin). Shared components in `src/components/elections/`. API layer in `src/lib/api/elections.ts`. Hooks in `src/lib/hooks/`. Types in `src/types/elections.ts`. Tests mirror source structure under `tests/`.

## Complexity Tracking

> No constitution violations requiring justification. Test infrastructure gap is addressed as a required implementation task, not a deviation.
