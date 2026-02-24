# Implementation Plan: Voter History & Election Participation

**Branch**: `006-voter-history-participation` | **Date**: 2026-02-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-voter-history-participation/spec.md`

## Summary

Display a voter's election participation history on their detail page (new card below existing content), show aggregate participation statistics per election, and browse which voters participated in a specific election. The election detail page gains a tabbed interface (Results / Participation) with the new shadcn/ui Tabs component. Recharts (already installed, unused) is used for the first time to render party and voting method breakdown charts. Role-based access restricts the election participant voter list to admin/analyst users.

## Technical Context

**Language/Version**: TypeScript 5.9+, strict mode
**Primary Dependencies**: React 19.2+, TanStack Router (file-based routing), TanStack Query (data fetching/caching), shadcn/ui (UI components), Recharts 3.7 (charts — installed, first use), ky (HTTP client), Zustand (auth state), React Hook Form + Zod (if needed for search), Sonner (toasts), Lucide React (icons)
**Storage**: N/A (frontend SPA — all data from voter-api backend at `/api/v1`)
**Testing**: Vitest + React Testing Library (unit, 95% coverage threshold), Playwright (E2E)
**Target Platform**: Web SPA deployed to Cloudflare Pages (S3/R2 compatible)
**Project Type**: Web (frontend only — consumes REST API)
**Performance Goals**: Page load with participation data < 2s (SC-001, SC-003), filter response < 1s (SC-002), page transitions < 2s (SC-004)
**Constraints**: Desktop + mobile responsive (SC-005), no backend changes (assumes API endpoints exist)
**Scale/Scope**: ~6 new components, 3 new API client functions, 3 new hooks, 2 existing pages modified, 1 new shadcn/ui component (Tabs)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Branch-Based Development | ✅ PASS | Already on `006-voter-history-participation` branch |
| II. Pull Request Review | ✅ PASS | Will be merged via PR with description and review |
| III. Test Coverage (95%) | ✅ PASS | All new components, hooks, and API functions will have unit tests |
| IV. Code Quality & Maintainability | ✅ PASS | Uses established patterns: `@/` imports, shadcn/ui, TanStack Query, Zustand RBAC |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/006-voter-history-participation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── voter-history.yaml
│   ├── participation-stats.yaml
│   └── election-participants.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── api/
│   └── voters.ts                          # MODIFY: add getVoterHistory()
├── lib/
│   └── api/
│       └── elections.ts                   # MODIFY: add getParticipationStats(), getElectionParticipants()
├── hooks/
│   └── useVoters.ts                       # MODIFY: add useVoterHistory()
├── lib/
│   └── hooks/
│       ├── use-participation-stats.ts     # NEW: TanStack Query hook for election stats
│       └── use-election-participants.ts   # NEW: TanStack Query hook for participant list
├── types/
│   ├── voter.ts                           # MODIFY: add VoterParticipationRecord
│   └── elections.ts                       # MODIFY: add ParticipationStats, ElectionParticipant, related types
├── routes/
│   ├── voters/
│   │   ├── $voterId.tsx                   # MODIFY: add VoterHistoryCard below DistrictAssignmentsCard
│   │   └── _components/
│   │       └── VoterHistoryCard.tsx       # NEW: voter's election participation history card
│   └── elections/
│       └── $electionDate/
│           └── $electionId.tsx            # MODIFY: wrap content in Tabs (Results / Participation)
├── components/
│   ├── ui/
│   │   └── tabs.tsx                       # NEW: shadcn/ui Tabs component (via `npx shadcn@latest add tabs`)
│   └── elections/
│       ├── ParticipationTab.tsx           # NEW: container for stats + voter list
│       ├── ParticipationStatsCard.tsx     # NEW: headline stats + Recharts bar/donut charts
│       └── ElectionParticipantList.tsx    # NEW: paginated voter table with search (admin/analyst only)

tests/
├── hooks/
│   ├── useVoterHistory.test.ts            # NEW
│   ├── use-participation-stats.test.ts    # NEW
│   └── use-election-participants.test.ts  # NEW
├── components/
│   ├── VoterHistoryCard.test.tsx          # NEW
│   ├── ParticipationTab.test.tsx          # NEW
│   ├── ParticipationStatsCard.test.tsx    # NEW
│   └── ElectionParticipantList.test.tsx   # NEW
└── routes/
    ├── voters/
    │   └── $voterId.test.tsx              # MODIFY: add participation history assertions
    └── elections/
        └── $electionDate/
            └── $electionId.test.tsx        # MODIFY: add tab switching + participation assertions

e2e/
├── fixtures/
│   └── mock-data.ts                       # MODIFY: add participation mock data
└── voter-history.spec.ts                  # NEW: E2E test for voter history + election participation
```

**Structure Decision**: Frontend-only SPA. All new code follows the established pattern — API client functions in `src/api/` or `src/lib/api/`, hooks in `src/hooks/` or `src/lib/hooks/`, route components in `src/routes/`, shared components in `src/components/`, types in `src/types/`. Tests mirror `src/` structure under `tests/`.

## Complexity Tracking

No constitution violations to justify. All patterns align with existing codebase conventions.
