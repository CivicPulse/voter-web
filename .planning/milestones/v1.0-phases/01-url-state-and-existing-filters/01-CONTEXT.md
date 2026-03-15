# Phase 1: URL State and Existing Filters - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate elections list filter state from Zustand store to URL search params via TanStack Router `validateSearch` + Zod. Expose all API-supported filters (date range, registration open, early voting active) alongside existing status and type filters. Add UX feedback: result count, active filter chips, clear-all action, and context-aware empty states.

</domain>

<decisions>
## Implementation Decisions

### Date range picker
- Preset dropdown using shadcn/ui Select with future-focused defaults
- Presets: Next 3 months (default), Next 6 months, This year, Last 30 days, Last 6 months, Last year, All time, Custom range
- Default landing preset: "Next 3 months" — most useful for voters looking ahead
- Selecting "Custom range" opens a popover (shadcn/ui Popover) with two native date inputs (From/To) and an Apply button
- Dropdown label shows preset name (e.g., "Next 3 months"), not computed dates
- URL params store resolved `date_from` and `date_to` values (not the preset name) for shareability

### Boolean filter controls
- Checkboxes (shadcn/ui Checkbox) with full-text labels: "Registration open" and "Early voting active"
- Same flex-wrap row as Select dropdowns — wraps naturally on narrow screens
- Unchecked = filter not applied (omitted from API params)

### Filter layout
- All filters in one `flex-wrap` row: Status Select, Type Select, Date preset Select, Registration checkbox, Early voting checkbox
- Matches existing `flex flex-wrap gap-3` pattern

### Active filter chips
- Positioned between filter controls and results list
- Outline Badge with X icon for removal — uses existing Badge component with "outline" variant
- Only non-default filter values shown as chips (default "Next 3 months" date preset does NOT generate a chip)
- Removing a chip resets that filter to its default value
- "Clear all filters" button at the end of the chip row
- Chip row hidden entirely when all filters are at default values

### Result count
- "Showing X of Y elections" displayed below chip row, above results
- X = filtered count on current page context, Y = total matching current filters

### Empty state
- When filters active + zero results: use EmptyState component with Vote icon, list active non-default filters as bullet points, "Try broadening your filters" suggestion, "Clear all filters" action button
- When no results at default filters (e.g., no elections in next 3 months): calm informational message "No elections available" / "There are no elections in the next 3 months", "Show all elections" button that switches date preset to "All time"

### URL state migration
- Replace Zustand `useElectionFilters` store with TanStack Router `validateSearch` + Zod schema on the elections route
- Page number also persisted in URL params
- Pagination resets to page 1 when any filter changes
- Browser back/forward navigates between filter states

### Claude's Discretion
- Zod schema field names and exact URL param encoding
- How to handle the preset-to-date_from/date_to resolution (utility function design)
- Search input behavior (keep existing client-side search for now, will be replaced in Phase 3)
- Exact typography and spacing within the chip row
- Loading skeleton design while filters are being applied

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Badge` component (`src/components/ui/badge.tsx`): outline variant for filter chips
- `EmptyState` component (`src/components/ui/empty-state.tsx`): icon/title/description/action pattern — may need minor extension for filter list in description
- `Select` component (`src/components/ui/select.tsx`): for date preset dropdown
- `Checkbox` component (`src/components/ui/checkbox.tsx`): for boolean filters
- `Popover` component (`src/components/ui/popover.tsx`): for custom date range input
- `Input` component (`src/components/ui/input.tsx`): for From/To date inputs in custom range popover

### Established Patterns
- `validateSearch` + Zod schema: already used in voters page (`src/routes/voters/index.tsx`) and election detail (`src/routes/elections/$electionDate.tsx`) — follow same `.optional().catch(undefined)` pattern
- `Route.useSearch()` + `useNavigate()`: voters page reads URL params and navigates to update them
- `useElections` hook (`src/lib/hooks/use-elections.ts`): already accepts `Partial<ElectionFilters>` including date_from, date_to, registration_open, early_voting_active — no hook changes needed
- `ElectionFilters` type (`src/types/elections.ts`): already defines all filter fields including date_from, date_to, registration_open, early_voting_active
- Flex-wrap filter row: existing `flex flex-wrap gap-3 mb-6` layout in elections list page

### Integration Points
- `src/routes/elections/index.tsx`: main file to modify — replace Zustand filter state with URL params
- `src/lib/hooks/use-election-filters.ts`: Zustand store to deprecate/remove for election list filters (may still be used elsewhere)
- `src/types/elections.ts`: `ElectionFilters` type — may need date preset field or keep as-is with resolved dates
- Geographic context banner: keep existing behavior, unaffected by filter changes

</code_context>

<specifics>
## Specific Ideas

- Date presets should be future-focused — the user thinks of elections as upcoming events, so "Next 3 months" is more useful than "Last 30 days" as a default
- Filter chips should feel lightweight — outline style, not heavy filled badges
- Empty state should be informative but calm — list what's filtered, don't panic the user

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-url-state-and-existing-filters*
*Context gathered: 2026-03-13*
