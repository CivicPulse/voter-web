# Technology Stack

**Project:** Better Elections Discovery
**Researched:** 2026-03-13

## Existing Stack (No Changes Needed)

These are already in the project and form the foundation. No version changes or replacements.

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| React | ^19.2.0 | UI framework | Installed |
| TypeScript | ~5.9.3 | Type safety (strict mode) | Installed |
| TanStack Router | ^1.159.5 | File-based routing, `validateSearch` for URL state | Installed |
| TanStack Query | ^5.90.21 | Data fetching, caching, `placeholderData` | Installed |
| Zod | ^4.3.6 | Schema validation (URL params, forms) | Installed |
| ky | ^1.14.3 | HTTP client with error hooks | Installed |
| Zustand | ^5.0.11 | Client state (auth, nav context -- NOT for filter state) | Installed |
| shadcn/ui | ^3.8.4 (CLI) | UI components (Select, Input, Badge, Popover already installed) | Installed |
| Sonner | ^2.0.7 | Toast notifications | Installed |
| Lucide React | ^0.563.0 | Icons | Installed |

**Confidence:** HIGH -- versions confirmed from `package.json`.

## New Dependencies

### 1. shadcn/ui Calendar + Date Picker (install via CLI)

**What:** Calendar and date picker components for the date range filter.

**Install:**
```bash
npx shadcn@latest add calendar
```

This pulls in `react-day-picker` (v9.14.0, latest) and `date-fns` (v4.1.0) as transitive dependencies. The shadcn/ui Calendar component was upgraded to react-day-picker v9 in June 2025, so the CLI installs the correct version.

**Why:** The project needs `date_from`/`date_to` filter controls. The shadcn/ui date picker supports `mode="range"` for selecting a date range via a Popover + Calendar composition. This is the standard shadcn/ui approach -- no custom date picker library needed. The Popover component is already installed.

**Why not `date-range-picker-for-shadcn`:** Community alternatives add preset ranges ("Last 7 days", "Last 30 days") which are overkill for election date filtering where users pick specific dates, not relative ranges. The official shadcn/ui date picker with range mode is sufficient and stays within the project's component conventions.

**Confidence:** HIGH -- shadcn/ui docs confirm Calendar + date-fns + react-day-picker v9 via CLI, with range mode support.

### 2. shadcn/ui Switch Component (install via CLI)

**What:** Toggle switch for boolean filters (`registration_open`, `early_voting_active`).

**Install:**
```bash
npx shadcn@latest add switch
```

**Why:** The project needs to expose `registration_open` and `early_voting_active` as boolean toggle filters. A Switch is more appropriate than a Checkbox for boolean API filters because it communicates on/off state (the filter is either applied or not), whereas a Checkbox implies inclusion in a set. The Toggle component is already installed but is styled as a button, not a labeled switch.

**Why not Checkbox:** Already have Checkbox installed but Switch better communicates filter enable/disable semantics for API boolean params.

**Confidence:** HIGH -- standard shadcn/ui component, no external dependencies beyond Radix (already installed).

### 3. date-fns (transitive, used directly)

**What:** Date formatting and manipulation.

**Version:** Installed automatically as dependency of react-day-picker via shadcn Calendar. Latest is 4.1.0.

**Why:** Used directly for formatting `date_from`/`date_to` values for display in the date range picker button label (e.g., `format(date, "MMM d, yyyy")`). Also used for converting between Date objects (from calendar selection) and ISO date strings (for URL params and API calls).

**Why not dayjs or luxon:** date-fns is what react-day-picker/shadcn Calendar depends on. Adding dayjs would mean two date libraries for no benefit.

**Confidence:** HIGH -- confirmed as react-day-picker dependency.

## No New Dependencies Needed For

### URL Filter State Management

**Use TanStack Router `validateSearch` with Zod 4 schemas.** The codebase already has this pattern established in 15+ routes (e.g., `src/routes/voters/index.tsx`, `src/routes/elections/$electionDate.tsx`). Zod 4 works natively with TanStack Router -- no `@tanstack/zod-adapter` needed (confirmed: adapter is unnecessary for Zod >= v4.0.6).

The established pattern uses `.optional().catch(undefined)` (NOT `.default()`):

```typescript
const electionSearchSchema = z.object({
  status: z.enum(["active", "finalized"]).optional().catch(undefined),
  election_type: z.enum(["general", "primary", "special", "runoff"]).optional().catch(undefined),
  date_from: z.string().optional().catch(undefined),
  date_to: z.string().optional().catch(undefined),
  registration_open: z.literal("true").optional().catch(undefined),
  early_voting_active: z.literal("true").optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
})

export const Route = createFileRoute("/elections/")({
  validateSearch: electionSearchSchema,
  component: ElectionsListPage,
})
```

**Critical detail:** Use `.optional().catch(undefined)`, NOT `.default("all")`. Defaults put "all" in every URL, and the "all" string gets sent to the API (where it may cause a 422). Instead, treat `undefined` as "no filter" and map to "All" only in the UI `Select` display. This matches the existing pattern in the codebase (see `src/routes/elections/$electionDate.tsx` lines 7-19).

**Why not nuqs:** nuqs provides component-level URL state management, but TanStack Router already provides route-level URL state with stronger type safety for linking. Adding nuqs alongside TanStack Router creates two competing URL state management systems. The existing codebase is fully committed to `validateSearch` -- nuqs would require an adapter for TanStack Router (still experimental as of v2.5) and the coexistence semantics are unclear.

**Confidence:** HIGH -- pattern verified in existing codebase, Zod 4 compatibility confirmed via TanStack Router GitHub issue #4322.

### Debounced Search Input

**Two patterns, for two purposes:**

1. **Client-side filtering (current page):** Use React 19's `useDeferredValue`. Already used in `src/routes/elections/index.tsx`. No network calls, no delay.

2. **Server-side search (all pages):** Use a custom `useDebouncedValue` hook with `setTimeout`. The input updates instantly (local state), but URL/API updates are debounced by 300ms.

```typescript
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}
```

**Why not TanStack Pacer:** `@tanstack/react-pacer` (v0.20.0) is pre-1.0 and adds a dependency for something achievable with a 6-line hook. The project only needs debounced server-side search -- not rate limiting, queuing, or batching. Revisit if the project needs more complex timing patterns later.

**Why not lodash.debounce:** Adds a dependency for a 6-line utility. The project doesn't use lodash for anything else.

**Confidence:** HIGH -- `useDeferredValue` already in use, custom debounce hook is trivial and well-established.

### Feature Detection for API Parameters

**No library needed.** Feature detection for new API params (`q`, `district`, `county`, `race_category`, `election_date`) is a custom pattern built on top of TanStack Query and ky's error handling.

**Recommended approach: Configuration flag, with runtime probe as fallback.**

The simplest reliable approach is a config flag (environment variable or hardcoded constant) that the frontend team updates when the backend team deploys new params. Runtime detection is harder than it sounds because FastAPI ignores unknown query params by default -- you cannot distinguish "API filtered by this" from "API silently ignored this" just by inspecting the response.

If runtime detection is preferred:
1. **If FastAPI uses `extra=forbid` on the elections query model:** Send the param, catch the 422 error, mark the filter as unsupported. This is clean and reliable.
2. **If FastAPI ignores unknown params (default):** Send a probe query with a value guaranteed to produce different results (e.g., `?q=ZZZZNOTAREALRACE`). If results are empty, the param was used. If results match unfiltered, the param was ignored. This is fragile.

Either way, this is custom code in a `useApiCapabilities` hook using TanStack Query with `staleTime: Infinity` (probe once per session).

**Confidence:** MEDIUM -- the pattern works, but the specific implementation depends on backend behavior (FastAPI `extra=forbid` vs default) which hasn't been confirmed.

### Smooth Filter Transitions (No Spinner Flash)

**Use TanStack Query's `placeholderData: keepPreviousData` option.** This keeps the previous page's data visible while new filtered results load, avoiding a loading spinner flash on every filter change.

```typescript
import { keepPreviousData } from "@tanstack/react-query"

useQuery({
  queryKey: ["elections", "list", filters, page],
  queryFn: () => getElections({ ...filters, page }),
  placeholderData: keepPreviousData,
  staleTime: 30_000,
})
```

The existing `useElections` hook does NOT use this option -- it should be added.

**Why not React Suspense:** The elections list uses `useQuery`, not `useSuspenseQuery`. Adding Suspense boundaries would require restructuring the component tree for minimal benefit in this paginated list context.

**Confidence:** HIGH -- documented TanStack Query v5 feature, `keepPreviousData` is the standard approach for paginated/filtered lists.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| URL state | TanStack Router `validateSearch` | nuqs | Already using TanStack Router for this; nuqs adapter for TanStack Router is experimental |
| URL state | TanStack Router `validateSearch` | @tanstack/zod-adapter | Unnecessary with Zod >= v4.0.6; adds a dependency for something that works natively |
| Date picker | shadcn/ui Calendar (range mode) | date-range-picker-for-shadcn | Preset ranges ("Last 7 days") not useful for election date filtering |
| Date picker | shadcn/ui Calendar (range mode) | react-datepicker | Different styling system; would not match shadcn/ui design language |
| Debounce | Custom 6-line hook | @tanstack/react-pacer (v0.20.0) | Pre-1.0 library, overkill for one debounced input |
| Debounce | Custom 6-line hook | lodash.debounce | Not using lodash anywhere else; unnecessary dependency |
| Boolean toggles | shadcn/ui Switch | shadcn/ui Checkbox | Switch better communicates filter on/off semantics |
| Boolean toggles | shadcn/ui Switch | shadcn/ui Toggle | Toggle is styled as a pressed/unpressed button, not a labeled switch |
| Smooth transitions | `placeholderData: keepPreviousData` | React Suspense | Would require component tree restructuring for minimal benefit |
| Feature detection | Config flag + optional probe | Feature flag service (LaunchDarkly, Unleash) | Massively overengineered for detecting 5 API params |

## Installation Summary

```bash
# New shadcn/ui components (calendar pulls in react-day-picker + date-fns)
npx shadcn@latest add calendar
npx shadcn@latest add switch

# No npm install needed -- all other patterns use existing dependencies
```

**Total new npm packages:** 2 transitive (react-day-picker v9.14.0, date-fns v4.1.0) via shadcn Calendar CLI.
**Total new direct dependencies:** 0 (everything is via shadcn CLI or already installed).
**Total new shadcn/ui components:** 2 (Calendar, Switch).

## Sources

- [TanStack Router: Search Params Are State](https://tanstack.com/blog/search-params-are-state) -- HIGH confidence
- [TanStack Router: Validate Search Params with Schemas](https://tanstack.com/router/latest/docs/framework/react/how-to/validate-search-params) -- HIGH confidence
- [Zod 4 + TanStack Router: No adapter needed](https://github.com/TanStack/router/issues/4322) -- HIGH confidence
- [shadcn/ui Calendar Upgrade to react-day-picker v9 (June 2025)](https://ui.shadcn.com/docs/changelog/2025-06-calendar) -- HIGH confidence
- [shadcn/ui Date Picker docs](https://ui.shadcn.com/docs/components/radix/date-picker) -- HIGH confidence
- [shadcn/ui Calendar docs](https://ui.shadcn.com/docs/components/base/calendar) -- HIGH confidence
- [react-day-picker v9.14.0 on npm](https://www.npmjs.com/package/react-day-picker) -- HIGH confidence
- [date-fns v4.1.0 on npm](https://www.npmjs.com/package/date-fns) -- HIGH confidence
- [TanStack Query: keepPreviousData replacement discussion](https://github.com/TanStack/query/discussions/6460) -- HIGH confidence
- [TanStack Pacer v0.20.0 on npm](https://www.npmjs.com/package/@tanstack/react-pacer) -- MEDIUM confidence (pre-1.0)
- [FastAPI: Forbid Extra Query Parameters](https://github.com/fastapi/fastapi/issues/2859) -- MEDIUM confidence
- [FastAPI: Unknown Parameters Discussion](https://github.com/fastapi/fastapi/discussions/9016) -- MEDIUM confidence
- [useDeferredValue vs debounce comparison](https://dev.to/junihoj/enhancing-performance-in-react-why-you-should-consider-usedeferredvalue-over-throttling-and-debouncing-99b) -- MEDIUM confidence
- [nuqs with TanStack Router adapter (experimental)](https://nuqs.dev/docs/adapters) -- MEDIUM confidence
