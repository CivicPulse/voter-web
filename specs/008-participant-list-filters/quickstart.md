# Quickstart: Participant List Filters

**Feature**: `008-participant-list-filters`
**Branch**: `008-participant-list-filters`

---

## Overview

Adds URL-persisted filter controls to the election participation voter list. Analysts can filter by county, voter status, district mismatch, precinct, ballot style, and legislative districts. All filter state lives in URL search params for bookmarkable/shareable views.

---

## Dev Setup

```bash
nvm use
npm install
cp .env.example .env  # already done if running previously
npm run dev           # http://localhost:5173
```

Navigate to an election with participation data: `/elections/{electionDate}?tab=participation`

---

## Key Files to Understand

| File | Purpose |
|------|---------|
| `src/routes/elections/$electionDate.tsx` | Route schema — where `p_*` params are declared |
| `src/components/elections/ParticipantFilters.tsx` | New filter bar component (create this) |
| `src/components/elections/ElectionParticipantList.tsx` | Table + filter integration point |
| `src/components/elections/ParticipationTab.tsx` | Route context bridge (reads `useSearch`) |
| `src/lib/hooks/use-election-participants.ts` | Data hook — extend params |
| `src/lib/api/elections.ts` | API client — extend `getElectionParticipants` |
| `src/routes/voters/_components/VoterSearchFilters.tsx` | Reference implementation |

---

## Implementation Order

Implement in this sequence to build incrementally:

### Step 1 — Route schema + type foundation
- Add `p_*` params to `searchSchema` in `$electionDate.tsx`
- Add `ParticipantUrlParams` type to `src/types/elections.ts`

### Step 2 — API + Hook layer
- Extend `getElectionParticipants()` to accept and forward all filter params
- Extend `useElectionParticipants` hook params and query key
- Tests for both

### Step 3 — `ParticipantFilters` component
- Create `src/components/elections/ParticipantFilters.tsx`
- Implement search input (debounced) + all 8 Select dropdowns
- Load county/ballot_style from `useParticipationStats`
- Load status/districts/precincts from `useVoterFilters`
- Tests covering filter value changes and URL updates

### Step 4 — Wire into `ElectionParticipantList`
- Add `params` + `onUpdate` props
- Remove internal `useState` for page/search
- Render `<ParticipantFilters>` above table
- Update empty state message logic
- Update tests

### Step 5 — Wire `ParticipationTab` to route
- Add `useSearch`/`useNavigate` calls in `ParticipationTab`
- Pass `params` + `onUpdate` down to `ElectionParticipantList`
- Tests for the navigation integration

### Step 6 — Visual verification
- `npm run dev` → navigate to election participation tab
- Verify filters render, URL updates on change, list refreshes
- Playwright MCP screenshots to `screenshots/008-participant-filters/`

---

## URL Anatomy

After applying county=BIBB + status=Active:
```
/elections/some-uuid?tab=participation&p_county=BIBB&p_voter_status=Active
```

After further navigating to page 2:
```
/elections/some-uuid?tab=participation&p_county=BIBB&p_voter_status=Active&p_page=2
```

After clearing county (resets precinct too):
```
/elections/some-uuid?tab=participation&p_voter_status=Active
```

---

## Testing

```bash
npm test                          # unit tests (watch)
npm test -- --run                 # unit tests (CI)
npm run build && npm run test:e2e # E2E (requires build)
```

Coverage target: 95% on all new/modified code.

---

## Pattern Reference

### updateFilter helper (in `ParticipantFilters`)
```typescript
const updateFilter = (updates: Partial<ParticipantUrlParams>) => {
  onUpdate({ ...updates, p_page: undefined })  // always reset pagination
}
```

### Debounced search (in `ParticipantFilters`)
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    const trimmed = searchInput.trim()
    if (trimmed !== (params.p_q ?? "")) {
      onUpdate({ p_q: trimmed || undefined, p_page: undefined })
    }
  }, 300)
  return () => clearTimeout(timer)
}, [searchInput, params.p_q, onUpdate])
```

### Select with "All" sentinel
```typescript
<Select
  value={params.p_county ?? "all"}
  onValueChange={(v) => updateFilter({ p_county: v === "all" ? undefined : v })}
>
  <SelectTrigger className="w-[160px]">
    <SelectValue placeholder="County" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Counties</SelectItem>
    {counties.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
  </SelectContent>
</Select>
```

### Route context reading (in `ParticipationTab`)
```typescript
import { useSearch, useNavigate } from "@tanstack/react-router"

const params = useSearch({ from: "/elections/$electionDate" })
const navigate = useNavigate({ from: "/elections/$electionDate" })
```
