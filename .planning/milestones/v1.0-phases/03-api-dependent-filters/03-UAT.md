---
status: complete
phase: 03-api-dependent-filters
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-03-15T12:00:00Z
updated: 2026-03-15T12:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Server-Side Search Input
expected: A search input appears when the capabilities endpoint indicates search support. Typing 2+ characters triggers a server-side search after a 300ms debounce. Hidden when capabilities lack search.
result: pass
note: Verified via E2E tests #15, #16, #17, #18

### 2. Race Category Dropdown
expected: A race category dropdown appears when capabilities indicate support. Options include Federal, State Senate, State House, Local. Selecting a value adds a race URL param and shows a filter chip.
result: pass
note: Verified via E2E tests #19, #20

### 3. County Combobox
expected: A county combobox with type-ahead search appears when both geographic and filterOptions capabilities are enabled. Selecting a county filters results and shows a chip.
result: pass
note: Verified via E2E tests #21, #22

### 4. Election Date Filter
expected: An election date filter shows a dropdown of formatted dates or falls back to native date input. Selecting a date adds election_date to URL and clears date range preset.
result: pass
note: Verified via E2E tests #23, #24

### 5. Capability-Gated Row 2
expected: The entire second row of filters only renders when at least one API capability flag is true. When all flags are false, only Row 1 is visible.
result: pass
note: Verified interactively (backend offline) and via E2E test #27

### 6. New Filter Chips
expected: Each new filter type produces a removable chip when active. Clicking X removes that filter, updates the URL, and refreshes results.
result: pass
note: Verified via E2E tests #25, #26

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
