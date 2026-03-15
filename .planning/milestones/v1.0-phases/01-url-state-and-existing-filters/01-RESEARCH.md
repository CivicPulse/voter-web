# Phase 1: URL State and Existing Filters - Research

**Researched:** 2026-03-13
**Domain:** TanStack Router URL search params, Zod v4 validation, React filter UI patterns
**Confidence:** HIGH

## Summary

This phase migrates the elections list page from Zustand-based filter state to URL search params using TanStack Router's `validateSearch` with Zod v4 schemas. The project already has 15 routes using this exact pattern, making this a well-trodden path with clear conventions to follow. The core technical work is: define a Zod schema for election search params, wire it into the route, replace all Zustand filter reads/writes with `Route.useSearch()` + `useNavigate()`, add new filter controls (date preset, boolean checkboxes), and implement UX feedback (result count, filter chips, empty state).

The main file to modify is `src/routes/elections/index.tsx` (304 lines). The Zustand store at `src/lib/hooks/use-election-filters.ts` provides both `electionFilters` (used in `elections/index.tsx`) and `raceFilters` (used in `race-list.tsx`). Since `raceFilters` is still needed by the race list component, the store cannot be deleted outright -- only the election filters portion becomes unused for the list page.

**Primary recommendation:** Follow the voters page pattern (`src/routes/voters/index.tsx`) exactly -- Zod schema with `.optional().catch(undefined)`, `Route.useSearch()` for reading, `navigate({ to: "/elections", search: {...} })` for writing. Add a date preset utility module for resolving preset names to date ranges.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Date range picker: Preset dropdown using shadcn/ui Select with future-focused defaults. Presets: Next 3 months (default), Next 6 months, This year, Last 30 days, Last 6 months, Last year, All time, Custom range. Default landing preset: "Next 3 months". Selecting "Custom range" opens a popover with two native date inputs (From/To) and an Apply button. Dropdown label shows preset name. URL params store resolved date_from and date_to values (not the preset name) for shareability.
- Boolean filter controls: Checkboxes (shadcn/ui Checkbox) with full-text labels: "Registration open" and "Early voting active". Same flex-wrap row as Select dropdowns. Unchecked = filter not applied (omitted from API params).
- Filter layout: All filters in one flex-wrap row: Status Select, Type Select, Date preset Select, Registration checkbox, Early voting checkbox. Matches existing flex flex-wrap gap-3 pattern.
- Active filter chips: Positioned between filter controls and results list. Outline Badge with X icon for removal. Only non-default filter values shown as chips (default "Next 3 months" does NOT generate a chip). Removing a chip resets that filter to its default value. "Clear all filters" button at end of chip row. Chip row hidden when all filters are at default values.
- Result count: "Showing X of Y elections" displayed below chip row, above results. X = filtered count on current page context, Y = total matching current filters.
- Empty state: When filters active + zero results: EmptyState component with Vote icon, list active non-default filters as bullet points, "Try broadening your filters" suggestion, "Clear all filters" action button. When no results at default filters: calm informational "No elections available" / "There are no elections in the next 3 months", "Show all elections" button.
- URL state migration: Replace Zustand useElectionFilters store with TanStack Router validateSearch + Zod schema. Page number also persisted in URL params. Pagination resets to page 1 on any filter change. Browser back/forward navigates between filter states.

### Claude's Discretion
- Zod schema field names and exact URL param encoding
- How to handle the preset-to-date_from/date_to resolution (utility function design)
- Search input behavior (keep existing client-side search for now, will be replaced in Phase 3)
- Exact typography and spacing within the chip row
- Loading skeleton design while filters are being applied

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| URL-01 | Filter state persists in URL search params via TanStack Router validateSearch with Zod schema | Established pattern in 15 existing routes; voters page is the closest reference implementation |
| URL-02 | Pagination resets to page 1 when any filter changes | Voters page `updateFilter` helper sets `page: 1` on every filter navigation -- follow same pattern |
| URL-03 | Browser back/forward navigates between previous filter states | Automatic with TanStack Router URL state -- no additional code needed beyond using `navigate()` |
| URL-04 | Shared URLs restore exact filter combination for the recipient | Zod `.catch()` ensures graceful fallback on invalid params; resolved dates in URL (not preset names) ensures shareability |
| FILT-01 | Date range filter using date_from/date_to | API client already sends these params; need preset dropdown + custom range popover UI |
| FILT-02 | Registration open toggle filter | API client already sends `registration_open=true`; need Checkbox control |
| FILT-03 | Early voting active toggle filter | API client already sends `early_voting_active=true`; need Checkbox control |
| FILT-04 | All filters visible inline without toggles/collapsing -- wrapping on smaller screens | Existing `flex flex-wrap gap-3` layout; add new controls to the same row |
| UX-01 | Result count "Showing X of Y elections" | API response includes `total` and `page_size`; compute X from `elections.length` on current page, Y from `total` |
| UX-02 | Active filters as removable badge chips | Badge component with "outline" variant already exists; build chip array from non-default search params |
| UX-03 | Clear all filters action | Reset navigate to `/elections` with default search params only |
| UX-04 | Empty state with active filter info and broadening suggestion | EmptyState component exists but needs minor extension (description as ReactNode for bullet list) or inline custom empty state |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-router | ^1.159.5 | File-based routing, URL search params via `validateSearch` | Project routing foundation; 15 routes already use this pattern |
| zod | ^4.3.6 | Schema validation for search params | Already integrated with TanStack Router in this project |
| @tanstack/react-query | ^5.90.21 | Data fetching with `useElections` hook | Existing hook needs zero changes -- already accepts `Partial<ElectionFilters>` |
| shadcn/ui (Select, Checkbox, Badge, Popover, Input, Button) | Latest via radix-ui ^1.4.3 | Filter controls and chips | All components already installed in project |
| lucide-react | ^0.563.0 | Icons (X, Vote, CalendarDays, Filter) | Project icon library |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | ^5.0.11 | Client state (still used for `raceFilters` and navigation context) | Keep for non-URL state; only election list filters move to URL |
| sonner | ^2.0.7 | Toast notifications | Not directly needed in this phase but available if errors need toasting |

### No New Dependencies Needed
This phase requires zero new npm packages. Everything is already installed.

## Architecture Patterns

### Recommended File Structure
```
src/
├── routes/
│   └── elections/
│       └── index.tsx              # MODIFY: Replace Zustand with validateSearch
├── lib/
│   └── date-presets.ts            # NEW: Date preset definitions + resolver
├── lib/hooks/
│   └── use-election-filters.ts    # KEEP: Still used for raceFilters by race-list.tsx
└── types/
    └── elections.ts               # NO CHANGES: ElectionFilters type already correct
```

### Pattern 1: Zod Search Schema with Defaults
**What:** Define a Zod object schema for all URL search params with `.optional().catch(undefined)` for graceful fallback on invalid URLs.
**When to use:** Every route that reads filter state from URL.
**Example (from existing voters page):**
```typescript
// Source: src/routes/voters/index.tsx (established project pattern)
const electionSearchSchema = z.object({
  status: z.enum(["all", "active", "finalized"]).optional().catch(undefined),
  type: z.enum(["all", "general", "primary", "special", "runoff"]).optional().catch(undefined),
  date_from: z.string().optional().catch(undefined),
  date_to: z.string().optional().catch(undefined),
  reg_open: z.literal("true").optional().catch(undefined),
  early_voting: z.literal("true").optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
})

export const Route = createFileRoute("/elections/")({
  component: ElectionsListPage,
  validateSearch: electionSearchSchema,
})
```

### Pattern 2: Navigate to Update Search Params
**What:** Use `useNavigate()` to update URL search params, spreading current params and overriding changed fields.
**When to use:** Every filter change handler, pagination change, clear-all action.
**Example (from existing voters page):**
```typescript
// Source: src/routes/voters/_components/VoterSearchFilters.tsx (established pattern)
const navigate = useNavigate()
const params = Route.useSearch()

const updateFilter = (updates: Partial<typeof params>) => {
  navigate({
    to: "/elections",
    search: {
      ...params,
      ...updates,
      page: 1, // Reset pagination on filter change (URL-02)
    },
  })
}
```

### Pattern 3: Date Preset Resolution
**What:** A utility module that maps preset names to `{ date_from, date_to }` date ranges, and a reverse-lookup that detects which preset (if any) matches current URL dates.
**When to use:** The date preset Select needs to show which preset is active, and changing the preset writes resolved dates to URL.

```typescript
// Recommended: src/lib/date-presets.ts
export type DatePresetKey =
  | "next-3-months"
  | "next-6-months"
  | "this-year"
  | "last-30-days"
  | "last-6-months"
  | "last-year"
  | "all-time"
  | "custom"

export interface DatePreset {
  key: DatePresetKey
  label: string
  resolve: () => { date_from?: string; date_to?: string }
}

// resolve() computes ISO date strings from current date
// reverse-match function: given date_from + date_to, return the matching preset key or "custom"
```

**Key design decision:** URL stores resolved `date_from`/`date_to` strings (not preset names), so the reverse-lookup runs on every render to determine which preset label to show. This is a pure function operating on two strings -- fast enough for inline computation.

### Pattern 4: Filter Chip Generation
**What:** Derive an array of "active filter" descriptors from current search params by comparing each param to its default value.
**When to use:** Rendering the chip row between filters and results.

```typescript
interface ActiveFilter {
  key: string           // URL param key to reset
  label: string         // Human-readable label for the chip
  resetValue: undefined // Value that removes this filter
}

// Compare each search param to its default:
// - status !== "all" (or undefined) → chip "Status: Active"
// - type !== "all" (or undefined) → chip "Type: General"
// - date_from/date_to that DON'T match "Next 3 months" → chip with preset label or date range
// - reg_open === "true" → chip "Registration open"
// - early_voting === "true" → chip "Early voting active"
// - search has content → chip with search text
```

### Anti-Patterns to Avoid
- **Mixing Zustand and URL state for the same data:** Never read election list filters from Zustand store AND URL params simultaneously. The migration must be complete for the elections list page.
- **Storing preset names in the URL:** The user decided URL stores resolved dates for shareability. If preset name were in URL, dates could drift when URLs are shared weeks later.
- **Using `replace: true` for filter changes:** Normal filter changes should create history entries (URL-03 requires back/forward navigation). Only use `replace: true` for initial context pre-population or corrective navigations.
- **Forgetting to set `page: 1` on filter changes:** Every filter update must include `page: 1` (URL-02). The voters page pattern does this in the `updateFilter` helper.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL param validation | Custom parsing of `URLSearchParams` | Zod schema + `validateSearch` | TanStack Router handles serialization/deserialization, error recovery via `.catch()`, and type safety |
| Browser history for filter states | Manual `pushState`/`popState` | TanStack Router `navigate()` (without `replace: true`) | Router integrates with React lifecycle, handles pending states, transitions |
| Date arithmetic for presets | Inline `new Date()` math in components | Dedicated `date-presets.ts` utility module | Presets need both forward resolution and reverse matching; centralizing avoids duplication |
| Filter state synchronization | Custom `useEffect` chains to sync URL ↔ component state | `Route.useSearch()` as single source of truth | Router search params ARE the state; no sync needed |

**Key insight:** The entire URL state pattern is already battle-tested in 15 routes in this codebase. The only novel part is the date preset logic and the chip/empty-state UX, which are standard React component work.

## Common Pitfalls

### Pitfall 1: Stale Closure in Navigate Callbacks
**What goes wrong:** Filter change handlers capture stale `params` from an earlier render, causing some params to revert when updating others.
**Why it happens:** React closures capture the value of `params` at the time the component rendered. If multiple filter changes happen quickly, the second may overwrite the first.
**How to avoid:** Read `Route.useSearch()` at the top of the component and always spread the latest `params` in navigate calls. Avoid storing params in intermediate state.
**Warning signs:** Changing one filter resets another filter to its previous value.

### Pitfall 2: "all" vs undefined for Select Values
**What goes wrong:** The existing Zustand store uses `"all"` as the default for status and election_type. URL params should use `undefined` (absent from URL) to mean "all" -- keeping URLs clean.
**Why it happens:** shadcn/ui Select requires a `value` prop; `undefined` causes the placeholder to show.
**How to avoid:** In the Zod schema, make status/type optional. In the Select component, use `value={params.status ?? "all"}` for display and `onValueChange` that sets `undefined` when "all" is selected. In the API call, `undefined` means "no filter" which is the same as "all".
**Warning signs:** URLs like `?status=all&type=all` when they should just be `/elections`.

### Pitfall 3: EmptyState Component Limitation
**What goes wrong:** The existing `EmptyState` component accepts `description: string`, but the user-decided empty state needs a bullet list of active filters within the description area.
**Why it happens:** The component interface was designed for simple text descriptions.
**How to avoid:** Either (a) extend `EmptyState` to accept `description: ReactNode` instead of `string`, or (b) build the empty state inline using the same visual pattern without the component. Option (a) is cleaner and backward-compatible since `string` is valid `ReactNode`.
**Warning signs:** Plain text description when filters should be listed as bullets.

### Pitfall 4: Default Date Preset Not Generating Chips
**What goes wrong:** The "Next 3 months" preset is the default landing state, but if implemented naively, the date_from/date_to params from this preset would appear as filter chips.
**Why it happens:** The chip generation logic sees date_from and date_to as "non-default" because they have values.
**How to avoid:** The chip generation function must know the "default preset" and exclude its date range from chip display. The cleanest approach: compare current date_from/date_to against the "Next 3 months" preset's resolved range. If they match, skip the date chip.
**Warning signs:** A "Next 3 months" chip appears on initial page load.

### Pitfall 5: Date Preset Reverse-Matching Drift
**What goes wrong:** The "Next 3 months" preset resolves to different dates each day. If a user bookmarks a URL with today's "Next 3 months" dates, tomorrow the reverse-match won't recognize it as "Next 3 months" anymore.
**Why it happens:** Presets are relative to the current date, but URLs store absolute dates.
**How to avoid:** This is expected behavior and acceptable -- the user decided URLs store resolved dates for shareability. The dropdown will show "Custom range" for bookmarked URLs from previous days, which is correct. The chip logic should handle this: if the dates don't match any preset, show a date range chip. No special handling needed.
**Warning signs:** None -- this is the intended behavior.

### Pitfall 6: Race Filters Store Dependency
**What goes wrong:** Deleting the entire `use-election-filters.ts` Zustand store breaks the race list component on the election detail page.
**Why it happens:** `src/routes/elections/$electionDate/_components/race-list.tsx` imports `useElectionFilters` for `raceFilters`.
**How to avoid:** Keep the Zustand store file. Only the elections list page stops using `electionFilters` from it. The `raceFilters` portion remains in use. Consider renaming to `use-race-filters.ts` or adding a comment explaining the partial deprecation.
**Warning signs:** Import errors in the race list component.

## Code Examples

### Election Search Schema (Zod v4)
```typescript
// Follows established project pattern from src/routes/voters/index.tsx
import { z } from "zod"

const electionSearchSchema = z.object({
  status: z.enum(["active", "finalized"]).optional().catch(undefined),
  type: z.enum(["general", "primary", "special", "runoff"]).optional().catch(undefined),
  date_from: z.string().optional().catch(undefined),
  date_to: z.string().optional().catch(undefined),
  reg_open: z.literal("true").optional().catch(undefined),
  early_voting: z.literal("true").optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
})
```

### Navigate with Filter Update
```typescript
// From Route.useSearch() + useNavigate() -- established pattern
const params = Route.useSearch()
const navigate = useNavigate()

function updateFilters(updates: Partial<z.infer<typeof electionSearchSchema>>) {
  navigate({
    to: "/elections",
    search: { ...params, ...updates, page: 1 },
  })
}

function clearAllFilters() {
  navigate({ to: "/elections", search: {} })
}
```

### Boolean Checkbox Filter
```typescript
// shadcn/ui Checkbox with label -- user-decided pattern
import { Checkbox } from "@/components/ui/checkbox"

<div className="flex items-center gap-2">
  <Checkbox
    id="reg-open"
    checked={params.reg_open === "true"}
    onCheckedChange={(checked) =>
      updateFilters({ reg_open: checked ? "true" : undefined })
    }
  />
  <label htmlFor="reg-open" className="text-sm font-medium leading-none">
    Registration open
  </label>
</div>
```

### Filter Chip with Removal
```typescript
// Badge "outline" variant with X icon -- user-decided pattern
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

<Badge variant="outline" className="gap-1 cursor-pointer" onClick={() => updateFilters({ status: undefined })}>
  Status: Active
  <X className="h-3 w-3" />
</Badge>
```

### Passing URL Params to API Hook
```typescript
// The useElections hook already accepts Partial<ElectionFilters>
// Map URL param names to ElectionFilters field names
const apiFilters = {
  status: params.status ?? "all",
  election_type: params.type ?? "all",
  date_from: params.date_from ?? null,
  date_to: params.date_to ?? null,
  registration_open: params.reg_open === "true" ? true : undefined,
  early_voting_active: params.early_voting === "true" ? true : undefined,
}
const { data, isLoading, error } = useElections(apiFilters, params.page ?? 1)
```

## State of the Art

| Old Approach (Current) | New Approach (This Phase) | Impact |
|------------------------|---------------------------|--------|
| Zustand store for election filters | TanStack Router URL search params | Enables URL sharing, browser history, bookmarking |
| `useState` for page number | Page in URL search params | Page survives refresh, shareable in URL |
| Only status + type filters visible | All API filters exposed (date, registration, early voting) | Users can narrow 1000+ elections effectively |
| Simple "No elections found" text | Context-aware empty state with filter info | Users understand why results are empty and how to fix it |
| No active filter indication | Removable badge chips for active filters | Users can see and manage active filters at a glance |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + jsdom + React Testing Library 16.3.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| URL-01 | Zod schema validates and falls back on bad params | unit | `npx vitest run tests/lib/date-presets.test.ts -t "schema"` | No - Wave 0 |
| URL-02 | Pagination resets on filter change | e2e | `npx playwright test e2e/elections-list.spec.ts -g "pagination reset"` | No - Wave 0 |
| URL-03 | Browser back/forward navigates filter states | e2e | `npx playwright test e2e/elections-list.spec.ts -g "back forward"` | No - Wave 0 |
| URL-04 | Shared URL restores exact filters | e2e | `npx playwright test e2e/elections-list.spec.ts -g "shared URL"` | No - Wave 0 |
| FILT-01 | Date preset resolves to correct date_from/date_to | unit | `npx vitest run tests/lib/date-presets.test.ts` | No - Wave 0 |
| FILT-02 | Registration open checkbox sends API param | unit | `npx vitest run tests/lib/date-presets.test.ts -t "registration"` | No - Wave 0 |
| FILT-03 | Early voting checkbox sends API param | unit | `npx vitest run tests/lib/date-presets.test.ts -t "early voting"` | No - Wave 0 |
| FILT-04 | All filters visible inline, wrapping layout | e2e | `npx playwright test e2e/elections-list.spec.ts -g "filter layout"` | No - Wave 0 |
| UX-01 | Result count displays correctly | e2e | `npx playwright test e2e/elections-list.spec.ts -g "result count"` | No - Wave 0 |
| UX-02 | Active filter chips shown and removable | e2e | `npx playwright test e2e/elections-list.spec.ts -g "filter chips"` | No - Wave 0 |
| UX-03 | Clear all filters action | e2e | `npx playwright test e2e/elections-list.spec.ts -g "clear all"` | No - Wave 0 |
| UX-04 | Empty state shows filter info | e2e | `npx playwright test e2e/elections-list.spec.ts -g "empty state"` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run` (unit tests)
- **Per wave merge:** `npm test -- --run && npx playwright test e2e/elections-list.spec.ts`
- **Phase gate:** Full unit + E2E suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/date-presets.test.ts` -- covers FILT-01 (date preset resolution), also schema validation for URL-01
- [ ] `e2e/elections-list.spec.ts` -- needs significant expansion for URL-02, URL-03, URL-04, UX-01 through UX-04 (existing file has only 3 basic tests)
- [ ] `e2e/fixtures/mock-data.ts` -- may need additional mock election data with date ranges, registration/early voting metadata for filter testing

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/routes/voters/index.tsx` -- reference implementation for validateSearch + Zod pattern
- Existing codebase: `src/routes/voters/_components/VoterSearchFilters.tsx` -- reference for filter update navigation pattern
- Existing codebase: `src/routes/elections/index.tsx` -- current implementation being modified
- Existing codebase: `src/lib/hooks/use-election-filters.ts` -- Zustand store being partially deprecated
- Existing codebase: `src/lib/api/elections.ts` -- API client already supports all filter params
- Existing codebase: `src/types/elections.ts` -- ElectionFilters type already defines all needed fields

### Secondary (MEDIUM confidence)
- [TanStack Router validateSearch docs](https://tanstack.com/router/latest/docs/framework/react/how-to/validate-search-params) -- confirms Zod v4 works via Standard Schema
- [TanStack Router Zod v4 issue #6138](https://github.com/TanStack/router/issues/6138) -- Zod v4 compatibility resolved; project already uses it successfully

### Tertiary (LOW confidence)
- None -- all findings verified against existing codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in use
- Architecture: HIGH -- pattern established in 15 existing routes, especially voters page
- Pitfalls: HIGH -- identified from direct codebase analysis and established patterns
- Date preset logic: MEDIUM -- novel utility module, but straightforward date arithmetic

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable -- no external dependencies or moving targets)
