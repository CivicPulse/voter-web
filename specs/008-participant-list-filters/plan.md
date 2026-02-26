# Implementation Plan: Participant List Filters

**Branch**: `008-participant-list-filters` | **Date**: 2026-02-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-participant-list-filters/spec.md`

## Summary

Add URL-persisted filter controls (county, voter status, district mismatch, precinct, ballot style, congressional/senate/house districts) to the election participation voter list. Filter state lives in TanStack Router URL search params on the `/elections/$electionDate` route. Filter options are populated via a hybrid strategy: participation stats endpoint (county, ballot style), voter filters API (districts, precinct, statuses), and static values (mismatch). No new API endpoints needed.

## Technical Context

**Language/Version**: TypeScript 5.9+ (strict mode)
**Primary Dependencies**: React 19.2+, TanStack Router (file-based routing, `validateSearch`), TanStack Query (data fetching), shadcn/ui (Select, Input), ky (HTTP client), Zod (schema validation)
**Storage**: N/A (frontend SPA)
**Testing**: Vitest + React Testing Library (unit), Playwright (E2E)
**Target Platform**: Browser SPA (Cloudflare Pages)
**Project Type**: Web (frontend-only, all data from voter-api)
**Performance Goals**: Filters take effect within one server round-trip (SC-006). No extra requests beyond what participations stats already fetches.
**Constraints**: No new API endpoints; reuse existing `/elections/{id}/participation/stats` and `/voters/filters`. 95% unit test coverage.
**Scale/Scope**: Frontend-only changes across ~8 files. No schema migrations.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Branch-Based Development | ✅ PASS | Already on `008-participant-list-filters` |
| II. Pull Request Review | ✅ PASS | Will merge via PR |
| III. 95% Test Coverage | ✅ PASS | New components and hook changes must reach 95% |
| IV. Code Quality | ✅ PASS | Following existing patterns (VoterSearchFilters), `@/` imports, shadcn/ui |

**Re-check post-design**: No constitution violations. Feature adds complexity only where required by spec (8 filter types, URL persistence). No unnecessary abstractions.

## Project Structure

### Documentation (this feature)

```text
specs/008-participant-list-filters/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── api-extension.md       # API contract
│   └── component-interfaces.md # Component contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── routes/
│   └── elections/
│       └── $electionDate.tsx        # MODIFY — extend searchSchema with p_* params
├── components/
│   └── elections/
│       ├── ParticipantFilters.tsx   # CREATE — new filter bar component
│       ├── ElectionParticipantList.tsx  # MODIFY — add params/onUpdate props
│       └── ParticipationTab.tsx     # MODIFY — bridge route search → child
├── lib/
│   ├── api/
│   │   └── elections.ts             # MODIFY — extend getElectionParticipants
│   └── hooks/
│       └── use-election-participants.ts  # MODIFY — extend params
└── types/
    └── elections.ts                 # MODIFY — add ParticipantUrlParams type

tests/
├── components/
│   └── elections/
│       ├── ParticipantFilters.test.tsx      # CREATE
│       └── ElectionParticipantList.test.tsx # MODIFY
└── lib/
    ├── api/
    │   └── elections.test.ts         # MODIFY
    └── hooks/
        └── use-election-participants.test.ts # MODIFY
```

**Structure Decision**: Single SPA project. All changes are frontend-only in `src/`. No backend changes — filter params forwarded to existing API endpoint.

## Complexity Tracking

No constitution violations requiring justification.

## Architecture Decisions

### URL Param Prefix: `p_`

Participant filter params prefixed `p_` (`p_county`, `p_q`, etc.) to prevent namespace collision with existing `tab` param or future route-level params on `/elections/$electionDate`.

### No Prop Drilling Through `ElectionDetailPage`

`ParticipationTab` reads filter params directly from route via `useSearch({ from: "/elections/$electionDate" })`. This avoids adding participant-specific props to `ElectionDetailPage` (which is already complex and unrelated to filter state). TanStack Router supports this pattern for any component in the route subtree.

### Filter Options: Reuse Existing Endpoints

| Filter | Source |
|--------|--------|
| County, Ballot Style | `/elections/{id}/participation/stats` (already fetched by `ParticipationStatsCard` — same TanStack Query key, zero extra requests) |
| Status, Districts, Precinct | `/voters/filters` (with optional county scope) |
| District Mismatch | Static constant |

### Separate `ParticipantFilters` Component

Not parameterizing `VoterSearchFilters` — the two components serve different data domains and route contexts. `ParticipantFilters` follows the same visual/UX pattern but is purpose-built. Code sharing is limited to the `updateFilter` helper pattern (inline, trivial).

## Implementation Sequence

Implemented in this order to enable incremental commits and independent testing:

1. **Type + route schema** — Zod schema extension + `ParticipantUrlParams` type
2. **API + hook** — `getElectionParticipants` extended params + `useElectionParticipants` extended params + tests
3. **`ParticipantFilters` component** — full filter bar with all dropdowns + tests
4. **`ElectionParticipantList` refactor** — accept props, render filters, update empty state + tests
5. **`ParticipationTab` bridge** — route context → `ElectionParticipantList` + tests
6. **Visual verification** — Playwright MCP screenshots

## Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Backend doesn't support filter params yet | Plan for graceful no-op: if backend ignores params, all records are returned unfiltered. Implement frontend first; backend can be wired without UI changes. |
| `useSearch({ from: ... })` type inference | Use the route's exported search type or cast explicitly. TanStack Router v1 supports string-based `from` with type inference. |
| `useVoterFilters` called without county loads all districts (not election-scoped) | Acceptable approximation per spec: "dynamic values derived from existing API where available." District lists are relatively stable. |
| Page reset on county change clears precinct correctly | Precinct clear is handled in `updateFilter` when county changes (same pattern as `VoterSearchFilters` prevCountyRef logic). |
