# Research: Participant List Filters

**Feature**: `008-participant-list-filters`
**Date**: 2026-02-26

---

## Finding 1: API Layer Has No Filter Support Yet

**Decision**: Extend `getElectionParticipants()` and `useElectionParticipants` to accept all 8 filter params.

**Rationale**: The current API client (`src/lib/api/elections.ts:191`) only passes `page`, `page_size`, `q`. The backend participation endpoint presumably supports additional filter query params (per the spec note about PR #83 wiring them in). The frontend client and hook must be updated to forward these params.

**Filter params to add**: `county`, `voter_status`, `has_district_mismatch`, `county_precinct`, `ballot_style`, `congressional_district`, `state_senate_district`, `state_house_district`.

**Alternatives considered**: None — this is a necessary change.

---

## Finding 2: Filter Option Population Strategy (Hybrid)

**Decision**: Use participation stats for county/ballot_style; voter filters API for precinct/districts when county is selected; static lists for mismatch and voter status.

| Filter | Source | Endpoint |
|--------|--------|----------|
| `county` | Dynamic | `GET /elections/{id}/participation/stats` → `by_county[]` |
| `ballot_style` | Dynamic | `GET /elections/{id}/participation/stats` → `by_ballot_style[]` |
| `county_precinct` | Dynamic (county-scoped) | `GET /voters/filters?county={county}` → `county_precincts[]` |
| `congressional_district` | Dynamic | `GET /voters/filters?county={county}` → `congressional_districts[]` |
| `state_senate_district` | Dynamic | `GET /voters/filters?county={county}` → `state_senate_districts[]` |
| `state_house_district` | Dynamic | `GET /voters/filters?county={county}` → `state_house_districts[]` |
| `voter_status` | Dynamic | `GET /voters/filters` → `statuses[]` |
| `has_district_mismatch` | Static | `["true", "false"]` |

**Rationale**:
- Participation stats are already fetched for the `ParticipationStatsCard` — same TanStack Query key means zero extra network requests.
- `useVoterFilters` is proven infrastructure; calling it with an optional county arg returns district/precinct lists dynamically.
- No new API endpoints needed.
- District/precinct options show county-level availability which is an acceptable proxy for "options available in this election."

**Alternatives considered**:
- Static bounded lists for district codes: rejected because maintaining hardcoded district number lists is brittle and doesn't account for per-state variation.
- New `/elections/{id}/participation/filter-options` endpoint: rejected because it requires backend changes and all needed data is already accessible via existing endpoints.

---

## Finding 3: URL Search Param Integration

**Decision**: Extend the `/elections/$electionDate` route search schema with prefixed participant filter params. Have `ParticipationTab` read them via `useSearch({ from: "/elections/$electionDate" })`.

**Rationale**: The existing `tab` param lives in the route schema. Participation filters belong in the same place so the full URL (including tab=participation) captures all state. Prefix with `p_` to avoid collisions with possible future params on the same route.

**Param names** (prefixed to avoid collision with future tab-level params):
```
p_q, p_county, p_voter_status, p_mismatch, p_precinct, p_ballot_style,
p_congressional, p_senate, p_house, p_page
```

**Component data flow**:
```
/elections/$electionDate route schema (validateSearch)
  → ElectionDateLayout (reads tab only, no change)
  → ElectionDetailPage → ParticipationTab
    → useSearch({ from: "/elections/$electionDate" }) [reads p_* params]
    → useNavigate({ from: "/elections/$electionDate" }) [updates p_* params]
    → ElectionParticipantList(params props)
      → ParticipantFilters component (filter bar UI)
      → useElectionParticipants hook (data fetch)
```

**Alternatives considered**:
- React component local state (existing pattern): rejected — violates FR-003/FR-007 (URL persistence, shareable views).
- Prop-drilling from `ElectionDateLayout` through `ElectionDetailPage`: rejected — creates unnecessary coupling; `ElectionDetailPage` is already complex and doesn't need to know about participant-specific filter state.
- Separate nested route for participation tab: rejected — the tab is implemented with shadcn Tabs on a single route, adding a nested route would break the existing tab switching pattern.

---

## Finding 4: Component Architecture — Reuse vs. New Component

**Decision**: Create a new `ParticipantFilters` component (not parameterize `VoterSearchFilters`).

**Rationale**: `VoterSearchFilters` is tightly coupled to `/voters` route navigation, `VoterSearchParams` type, and voter-specific filter semantics. Parameterizing it would require significant API surface changes for marginal reuse. A dedicated `ParticipantFilters` component follows the same visual/UX pattern while having clean, purpose-built props.

**Shared**: visual pattern (shadcn Select, Input, flex-wrap row), `updateFilter` helper pattern, debounced search pattern.

**Alternatives considered**:
- Parameterize `VoterSearchFilters` with generic `navigate` callback + filter config: rejected — over-engineering; the components serve different data domains.

---

## Finding 5: Voter Status Static vs. Dynamic

**Decision**: Use `GET /voters/filters` (no county scope) to populate voter status options dynamically.

**Rationale**: The `useVoterFilters(undefined)` call returns all available statuses from the backend. This is more robust than maintaining a hardcoded list. Since status is not election-scoped (registration statuses are global data), calling without county context returns all possible values.

**Known status values** (for reference): `Active`, `Inactive`, `Cancelled`, `Pending`. Backend is authoritative.

---

## Finding 6: Pagination Reset on Filter Change

**Decision**: Resetting `p_page` to `1` (or removing it from URL) on any filter change is handled in the `updateFilter` helper inside `ParticipantFilters`.

**Rationale**: This matches existing behavior in `VoterSearchFilters` (`updateFilter` always sets `page: 1`) and `ElectionParticipantList` (already resets page on search change). Centralizing in the filter component ensures consistency.

---

## Finding 7: Empty State Message Differentiation

**Decision**: Track whether any filter is active; show two distinct messages.
- No filters: "No participants found for this election."
- Filters active: "No voters match the current filters."

**Rationale**: FR-006 requires this distinction. Can be computed client-side by checking if any `p_*` param is defined in the search state.

---

## Resolution Summary

All "NEEDS CLARIFICATION" items from the technical context are resolved:
- ✅ API filter param support: extend existing client/hook
- ✅ Filter option population: hybrid (stats + voter-filters API + static)
- ✅ URL integration: route schema extension with `p_` prefix
- ✅ Component architecture: new `ParticipantFilters` component
- ✅ Voter status values: dynamic from `/voters/filters`
- ✅ Pagination reset: `updateFilter` helper pattern
- ✅ Empty state: dual-message based on active filter detection
