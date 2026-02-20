# Implementation Plan: Meeting Archives Browser

**Branch**: `005-meeting-archives` | **Date**: 2026-02-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-meeting-archives/spec.md`

## Summary

Build the user-facing web interface for browsing, searching, and viewing local government meeting archives on the CivicPulse civic transparency platform. This is a **frontend-only** feature adding ~6 new routes under `/meetings` with TanStack Router file-based routing, consuming a new set of public API endpoints on the voter-api backend (API contracts defined in this plan; backend implementation is a separate effort). Key components: governing body directory with filtering, meeting detail with expandable agenda items, YouTube/Vimeo video embeds with timestamp navigation, file attachments with PDF preview, full-text search with highlighted snippets, and breadcrumb navigation.

## Technical Context

**Language/Version**: TypeScript 5.9+, React 19.2+
**Primary Dependencies**: TanStack Router (file-based routing, Vite plugin), TanStack Query (data fetching/caching), ky (HTTP client), shadcn/ui (UI components), Tailwind CSS v4, Zod (URL param validation), Lucide React (icons), Sonner (toasts), DOMPurify (HTML sanitization for search highlights)
**Storage**: N/A (frontend SPA — all data from voter-api backend at `/api/v1`)
**Testing**: Vitest + React Testing Library (unit, 95% coverage), Playwright (E2E with mocked API)
**Target Platform**: Web SPA deployed to Cloudflare Pages (S3/R2 static hosting)
**Project Type**: Web SPA (single frontend project)
**Performance Goals**: Initial page load <3s on 3G mobile (SC-002), search results <2s (SC-003), meeting detail with 20+ agenda items renders without lag on mobile (SC-007)
**Constraints**: WCAG 2.1 AA accessibility, responsive from 320px, fully public (no auth required for viewing — FR-024), keyboard navigable
**Scale/Scope**: ~6 new routes, ~15 new components, 1 new API module, 1 new types file, 1 new hooks file, 1 utility module, ~1 modified file (`__root.tsx` for nav)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Branch-Based Development** | PASS | Work on `005-meeting-archives` branch, created before code changes |
| **II. Pull Request Review** | PASS | All code will be merged via PR with review |
| **III. Test Coverage (95%)** | PASS | Unit tests planned for all new modules; E2E tests for user flows |
| **IV. Code Quality & Maintainability** | PASS | Using `@/` imports, TypeScript strict mode, ESLint, shadcn/ui, established patterns (TanStack Router/Query, Zustand, ky) |

### Post-Phase 1 Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Branch-Based Development** | PASS | All work on `005-meeting-archives` branch |
| **II. Pull Request Review** | PASS | PR required before merge to `main` |
| **III. Test Coverage (95%)** | PASS | Test plan covers: types/utils (unit), hooks (unit with mocked API), components (RTL), E2E flows (Playwright) |
| **IV. Code Quality & Maintainability** | PASS | Follows all existing patterns: file-based routing, TanStack Query hooks, typed API client, shadcn/ui components, Zod validation. Only 1 new npm dependency (DOMPurify). No over-engineering — minimal additions needed. |

**Technology Constraints Compliance**:
- React 19 + TypeScript + Vite 7: Yes
- Node.js LTS: Yes
- npm for package management: Yes
- Tailwind CSS v4 utility-first: Yes
- shadcn/ui components: Yes (adding `breadcrumb`, using existing `collapsible`, `card`, `badge`, `skeleton`, `empty-state`, `input`, `select`, `dialog`, `button`, `table`)

## Project Structure

### Documentation (this feature)

```text
specs/005-meeting-archives/
├── plan.md              # This file
├── research.md          # Phase 0 output — 10 research decisions
├── data-model.md        # Phase 1 output — 5 entities, 4 enums
├── quickstart.md        # Phase 1 output — developer setup guide
├── contracts/
│   └── openapi.yaml     # Phase 1 output — 8 API endpoints
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── meetings.ts                          # All meeting archive types + enums + utilities
├── lib/
│   ├── api/
│   │   └── meetings.ts                      # API client functions (8 endpoints)
│   ├── hooks/
│   │   └── use-meetings.ts                  # TanStack Query hooks (~8 hooks)
│   └── meetings-utils.ts                    # Video URL parsing, label maps, sanitization
├── components/ui/
│   └── breadcrumb.tsx                       # shadcn/ui breadcrumb (installed via CLI)
├── routes/
│   ├── __root.tsx                           # MODIFIED: Add "Meetings" nav item
│   └── meetings/
│       ├── index.tsx                        # Landing page: search bar + body directory
│       ├── bodies/
│       │   ├── index.tsx                    # Governing bodies directory (filtered list)
│       │   └── $bodySlug/
│       │       ├── index.tsx                # Body detail + meeting history
│       │       └── $date/
│       │           └── $seq.tsx             # Meeting detail page
│       ├── all/
│       │   └── index.tsx                    # All meetings cross-body list
│       ├── search/
│       │   ├── index.tsx                    # Search results page
│       │   └── _components/
│       │       ├── search-filters.tsx       # Faceted filter sidebar
│       │       └── search-result-card.tsx   # Individual result with snippet
│       └── _components/
│           ├── meeting-card.tsx             # Meeting list item card
│           ├── meeting-breadcrumb.tsx       # Breadcrumb nav wrapper
│           ├── agenda-item-list.tsx         # Ordered agenda item list
│           ├── agenda-item.tsx              # Single collapsible agenda item
│           ├── video-embed.tsx              # YouTube/Vimeo iframe embed
│           ├── attachment-list.tsx          # File attachment list with download
│           ├── pdf-preview-dialog.tsx       # Inline PDF viewer in dialog
│           ├── meeting-search-bar.tsx       # Reusable search input
│           ├── bodies-filter-bar.tsx        # Body type + jurisdiction filters
│           └── body-card.tsx                # Governing body list card

tests/
├── types/
│   └── meetings.test.ts                     # Type utility + label map tests
├── lib/
│   ├── meetings-utils.test.ts               # Video URL parsing, sanitization tests
│   └── hooks/
│       └── use-meetings.test.ts             # Hook tests with mocked API
├── routes/meetings/
│   └── _components/
│       ├── video-embed.test.tsx             # Video embed component tests
│       ├── agenda-item.test.tsx             # Collapsible agenda item tests
│       └── search-result-card.test.tsx      # Search result rendering tests

e2e/
├── meetings.spec.ts                         # E2E: browse bodies → meeting → agenda
├── meetings-search.spec.ts                  # E2E: search → results → meeting detail
└── fixtures/
    └── meetings-api.ts                      # Mock API route interception
```

**Structure Decision**: Single frontend SPA project. All new code follows the established voter-web architecture: types in `src/types/`, API client in `src/lib/api/`, hooks in `src/lib/hooks/`, routes in `src/routes/`, shared components in route-level `_components/` directories.

## Complexity Tracking

No constitution violations. No complexity justifications needed.

All design decisions favor simplicity:
- Raw `<iframe>` for video embeds instead of `react-player` library
- Browser-native PDF rendering instead of `pdf.js`
- Existing `collapsible` component instead of custom expand/collapse
- Offset-based pagination matching existing patterns
- Only 1 new npm dependency (`dompurify`)
