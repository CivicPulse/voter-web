# Data Model: Participant List Filters

**Feature**: `008-participant-list-filters`
**Date**: 2026-02-26

---

## Entities

### ParticipantFilterParams (frontend state / URL search params)

All fields optional. Absent = "no filter applied" for that dimension.

| Field | Type | Source | URL Param |
|-------|------|--------|-----------|
| `q` | `string \| undefined` | user text input (debounced) | `p_q` |
| `county` | `string \| undefined` | Select dropdown | `p_county` |
| `voter_status` | `string \| undefined` | Select dropdown | `p_voter_status` |
| `has_district_mismatch` | `"true" \| "false" \| undefined` | Select dropdown | `p_mismatch` |
| `county_precinct` | `string \| undefined` | Select dropdown | `p_precinct` |
| `ballot_style` | `string \| undefined` | Select dropdown | `p_ballot_style` |
| `congressional_district` | `string \| undefined` | Select dropdown | `p_congressional` |
| `state_senate_district` | `string \| undefined` | Select dropdown | `p_senate` |
| `state_house_district` | `string \| undefined` | Select dropdown | `p_house` |
| `page` | `number \| undefined` | pagination | `p_page` |

**Validation rules:**
- `has_district_mismatch`: enum `["true", "false"]`, `.catch(undefined)`
- All string params: `.optional().catch(undefined)` (invalid URL values silently cleared)
- `page`: `z.coerce.number().int().positive().optional().catch(undefined)`
- Resetting a filter removes its URL param (not set to empty string)

---

### ParticipantFilterOptions (dynamically resolved)

Options available for each dropdown, resolved from multiple sources.

| Filter | Source | Hook | Cache |
|--------|--------|------|-------|
| `counties` | Participation stats `by_county[]` | `useParticipationStats(electionId)` | Already fetched by `ParticipationStatsCard` |
| `ballot_styles` | Participation stats `by_ballot_style[]` | `useParticipationStats(electionId)` | Same query key = no extra request |
| `voter_statuses` | Voter filters API | `useVoterFilters(undefined)` | 5 min stale time |
| `county_precincts` | Voter filters API (county-scoped) | `useVoterFilters({ county })` | Per-county, 5 min stale |
| `congressional_districts` | Voter filters API (county-scoped) | `useVoterFilters({ county })` | Per-county, 5 min stale |
| `state_senate_districts` | Voter filters API (county-scoped) | `useVoterFilters({ county })` | Per-county, 5 min stale |
| `state_house_districts` | Voter filters API (county-scoped) | `useVoterFilters({ county })` | Per-county, 5 min stale |
| `has_district_mismatch` | Static | Inline constant | N/A |

**Static values:**
```typescript
const MISMATCH_OPTIONS = [
  { value: "true",  label: "Mismatch Only" },
  { value: "false", label: "No Mismatch" },
]
```

---

### ElectionParticipant (existing, extended API contract)

The existing `ElectionParticipant` type in `src/types/elections.ts` remains unchanged. The API filter params are applied server-side; the client receives the filtered + paginated page.

```typescript
// Existing — no change needed
export interface ElectionParticipant {
  id: string
  voter_id: string | null
  voter_registration_number: string
  first_name: string
  last_name: string
  county: string
  voting_method: string
}
```

---

## State Transitions

### Filter State Machine

```
[No filters] ──(select filter)──→ [Filtered]
    ↓ always shows                    ↓ shows filtered count
"No participants in election"    "No voters match filters"
(if zero results)                (if zero results)

[Filtered] ──(change filter)──→ [Filtered] + page reset to 1
[Filtered] ──(clear filter)──→ [No filters] (param removed from URL)
```

### Pagination Behaviour

```
Current page P, filters F:
  ├─ Navigate to page P+1: URL: p_page=P+1, all filters preserved
  ├─ Change any filter:    URL: p_page removed (defaults to 1), new filter value
  └─ Clear all filters:   URL: all p_* params removed
```

---

## Type Additions

### `src/types/elections.ts` additions

```typescript
/** Filter params for the election participation list */
export interface ParticipantFilterParams {
  q?: string
  county?: string
  voter_status?: string
  has_district_mismatch?: "true" | "false"
  county_precinct?: string
  ballot_style?: string
  congressional_district?: string
  state_senate_district?: string
  state_house_district?: string
  page?: number
}
```

### Hook signature update (`src/lib/hooks/use-election-participants.ts`)

```typescript
// Before
params: { page: number; pageSize: number; search: string }

// After
params: {
  page: number
  pageSize: number
  search?: string
  county?: string
  voter_status?: string
  has_district_mismatch?: "true" | "false"
  county_precinct?: string
  ballot_style?: string
  congressional_district?: string
  state_senate_district?: string
  state_house_district?: string
}
```

### API function signature update (`src/lib/api/elections.ts`)

```typescript
// Before
params?: { page?: number; page_size?: number; q?: string }

// After
params?: {
  page?: number
  page_size?: number
  q?: string
  county?: string
  voter_status?: string
  has_district_mismatch?: boolean
  county_precinct?: string
  ballot_style?: string
  congressional_district?: string
  state_senate_district?: string
  state_house_district?: string
}
```
