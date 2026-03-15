---
status: complete
phase: 03-api-dependent-filters
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-03-15T12:00:00Z
updated: 2026-03-15T04:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Server-Side Search Input
expected: A search input appears when the capabilities endpoint indicates search support. Typing 2+ characters triggers a server-side search after a 300ms debounce. A loading spinner shows during the search request. Results update to show matches. When capabilities lack search support, the search input is hidden.
result: pass
note: Verified via code (index.tsx:404 gates on flags.search, debounce at 300ms in useEffect:196-209, spinner at :406-408) and E2E tests (elections-list.spec.ts:207-263 cover search visibility, debounce, URL update, and q param in API calls). Playwright confirmed search input is hidden when capabilities endpoint fails.

### 2. Race Category Dropdown
expected: A race category dropdown appears when capabilities indicate support. Options include Federal, State Senate, State House, Local (from API or hardcoded fallback). Selecting a value adds a race URL param, filters results, and shows a "Race: [value]" filter chip.
result: pass
note: Verified via code (index.tsx:543 gates on flags.raceCategory, dropdown with RACE_CATEGORY_LABELS at :556-561) and E2E tests (elections-list.spec.ts:265-290 cover visibility and race=federal URL update). Chip rendering in deriveActiveFilters handles race key.

### 3. County Combobox
expected: A county combobox with type-ahead search appears when both geographic and filterOptions capabilities are enabled. If the user navigated from a county page, the county is auto-populated. Selecting a county filters results and shows a "County: [name]" chip. The combobox is hidden when capabilities don't support it.
result: pass
note: Verified via code (index.tsx:567 gates on flags.geographic && flags.filterOptions, Command/Popover combobox with search at :581-616, auto-populate from navigation context at :226-238). E2E tests (elections-list.spec.ts:292+) cover combobox visibility and county selection.

### 4. Election Date Filter
expected: An election date filter appears when capabilities indicate support. Shows a dropdown of available election dates (formatted like "Nov 3, 2026") if filter-options returns dates, or falls back to a native date input. Selecting a date adds election_date to URL, clears any date range preset, and shows a date filter chip.
result: pass
note: Verified via code (index.tsx:624 gates on flags.electionDate, conditional rendering: Select dropdown when filterOptionsData?.election_dates exists at :626-649, native date input fallback at :650-665, both clear date_from/date_to and set date_preset to "all-time"). E2E tests cover election date filtering.

### 5. Capability-Gated Row 2
expected: The entire second row of filters (race category, county, election date) only renders when at least one API capability flag for these filters is true. When all flags are false, only Row 1 (date preset, status, type, booleans) is visible.
result: pass
note: Verified via code (index.tsx:540 — Row 2 wrapper gated by `flags.raceCategory || flags.electionDate || (flags.geographic && flags.filterOptions)`). Playwright confirmed with live browser: when capabilities endpoint fails, only Row 1 renders (5 controls: status, type, date preset, 2 checkboxes). No Row 2 elements in snapshot.

### 6. New Filter Chips
expected: Each new filter type (search, race category, county, election date) produces a removable chip when active. Clicking the X on any chip removes that filter, updates the URL, and refreshes results.
result: pass
note: Verified via code (deriveActiveFilters in election-search.ts handles q, race, county, election_date keys; onRemoveChip at index.tsx:320-335 clears each; Badge chips rendered at :672-694). E2E tests verify chip removal updates URL.

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
