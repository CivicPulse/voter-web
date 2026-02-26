# Component Interfaces: Participant List Filters

**Feature**: `008-participant-list-filters`

---

## New Component: `ParticipantFilters`

**Location**: `src/components/elections/ParticipantFilters.tsx`

**Purpose**: Filter bar for the election participation list. Mirrors the layout and UX of `VoterSearchFilters` but adapted for election participation context.

### Props

```typescript
interface ParticipantFiltersProps {
  electionId: string
  params: ParticipantUrlParams        // current URL search param values
  onUpdate: (updates: Partial<ParticipantUrlParams>) => void  // navigate callback
}

interface ParticipantUrlParams {
  p_q?: string
  p_county?: string
  p_voter_status?: string
  p_mismatch?: "true" | "false"
  p_precinct?: string
  p_ballot_style?: string
  p_congressional?: string
  p_senate?: string
  p_house?: string
  p_page?: number
}
```

### Behaviour

- Debounced search input (300ms) updates `p_q` in URL
- All Select changes call `onUpdate({ [param]: value === "all" ? undefined : value, p_page: undefined })`
  - `undefined` removes the param from URL (FR-008)
  - `p_page: undefined` resets pagination on every filter change (FR-004)
- County, ballot_style options loaded from `useParticipationStats(electionId)`
- Voter status options loaded from `useVoterFilters(undefined)` (no county scope)
- When `p_county` is set: county_precinct, congressional, senate, house options loaded from `useVoterFilters({ county: p_county })`
- **District dropdowns (congressional, state senate, state house) are always visible regardless of county selection.** When a county is selected, their option lists are narrowed to districts relevant to that county via `useVoterFilters({ county: p_county })`; when no county is selected, district options are loaded from `useVoterFilters(undefined)`. The dropdowns themselves never disappear.
- When `p_county` changes, **only `p_precinct` is cleared** (county precinct is county-scoped; a precinct from the previous county is invalid in the new county). Congressional, state senate, and state house district params are preserved — they combine with the new county per US4 AC5.

### Layout

```
[ Search input (flex-1) ] [ County ] [ Status ] [ District Check ]
[ Congressional ]  [ State Senate ] [ State House ]

When county selected (second row):
[ {county} districts: ] [ Precinct ] [ Ballot Style ]
```

All filters in a `flex flex-wrap gap-3` container. Always visible (no toggle/collapse).

---

## Modified Component: `ElectionParticipantList`

**Location**: `src/components/elections/ElectionParticipantList.tsx`

### Current Props
```typescript
{ electionId: string }
```

### New Props
```typescript
{
  electionId: string
  params: ParticipantUrlParams           // current URL filter state
  onUpdate: (updates: Partial<ParticipantUrlParams>) => void
}
```

### Changes
- Remove internal `useState` for `page`, `searchInput`
- Derive page from `params.p_page ?? 1`
- Render `<ParticipantFilters>` above the table
- Pass all filter params to `useElectionParticipants`
- Empty state: check `hasActiveFilters(params)` to choose message

### `hasActiveFilters` helper
```typescript
function hasActiveFilters(params: ParticipantUrlParams): boolean {
  return !!(params.p_q || params.p_county || params.p_voter_status ||
    params.p_mismatch || params.p_precinct || params.p_ballot_style ||
    params.p_congressional || params.p_senate || params.p_house)
}
```

---

## Modified Component: `ParticipationTab`

**Location**: `src/components/elections/ParticipationTab.tsx`

### Changes
- Import `useSearch`, `useNavigate` from `@tanstack/react-router`
- Read participant filter params: `useSearch({ from: "/elections/$electionDate" })`
- Provide `onUpdate` navigate callback that updates `p_*` params
- Pass `params` and `onUpdate` to `ElectionParticipantList`

```typescript
function ParticipationTab({ electionId }) {
  const params = useSearch({ from: "/elections/$electionDate" })
  const navigate = useNavigate({ from: "/elections/$electionDate" })

  const filterParams: ParticipantUrlParams = {
    p_q: params.p_q,
    p_county: params.p_county,
    // ... all p_* fields
  }

  const handleUpdate = (updates: Partial<ParticipantUrlParams>) => {
    navigate({ search: (prev) => ({ ...prev, ...updates }), replace: true })
  }

  return (
    <div className="space-y-6">
      <ParticipationStatsCard electionId={electionId} />
      {isAdmin && (
        <ElectionParticipantList
          electionId={electionId}
          params={filterParams}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
```

---

## Modified Route: `/elections/$electionDate`

**Location**: `src/routes/elections/$electionDate.tsx`

### Changes
- Extend `searchSchema` with `p_*` participant filter params
- No other changes to `ElectionDateLayout` component (reads only `tab`)

---

## Modified Hook: `useElectionParticipants`

**Location**: `src/lib/hooks/use-election-participants.ts`

```typescript
export function useElectionParticipants(
  electionId: string,
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
  },
  enabled: boolean,
)
```

- Query key includes all filter params for correct cache invalidation
- All filter values forwarded to `getElectionParticipants()`
- `has_district_mismatch` converted from string `"true"/"false"` to boolean for API

---

## File Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/routes/elections/$electionDate.tsx` | Modify | Extend searchSchema with `p_*` params |
| `src/components/elections/ParticipantFilters.tsx` | Create | New filter bar component |
| `src/components/elections/ElectionParticipantList.tsx` | Modify | Accept params/onUpdate props, render filters |
| `src/components/elections/ParticipationTab.tsx` | Modify | Read route search, provide navigate callback |
| `src/lib/hooks/use-election-participants.ts` | Modify | Extended params support |
| `src/lib/api/elections.ts` | Modify | `getElectionParticipants` extended filter params |
| `src/types/elections.ts` | Modify | Add `ParticipantFilterParams`, `ParticipantUrlParams` types |
| `tests/components/elections/ParticipantFilters.test.tsx` | Create | Unit tests for filter component |
| `tests/components/elections/ElectionParticipantList.test.tsx` | Modify | Extended tests for filter integration |
| `tests/lib/hooks/use-election-participants.test.ts` | Modify | Tests for extended params |
| `tests/lib/api/elections.test.ts` | Modify | Tests for extended API function |
