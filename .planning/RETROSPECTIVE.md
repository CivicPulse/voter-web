# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Better Elections Discovery

**Shipped:** 2026-03-15
**Phases:** 3 | **Plans:** 5 | **Sessions:** ~4

### What Was Built
- URL-persisted filter state with date presets, status/type/boolean filters across the elections list page
- UX feedback layer: removable filter chips, result counts, context-aware empty states (filtered vs default)
- Feature-detection infrastructure: capabilities endpoint probing with strict false-on-error fallback
- 463-line API specification for backend team covering 5 new filter parameters and filter-options endpoint
- Server-side search with 300ms debounce, race category dropdown, county combobox (auto-populated from nav context), election date filter
- All advanced filters gated by API capability flags with graceful degradation

### What Worked
- Three-phase structure (existing filters → infrastructure → advanced filters) gave clean dependency ordering and avoided blocked work
- Extracting utility functions to `src/lib/` early (Plan 01-01) established a pattern that every subsequent plan benefited from
- Feature-detection approach allowed shipping all UI work without waiting for backend changes
- TDD on the capabilities mapping produced clean, well-tested code with only 1 minor deviation across 5 plans
- Average plan execution time improved from 11min (Phase 1) to 5min (Phase 3) — familiarity compound effect

### What Was Inefficient
- ROADMAP.md phase checkboxes not always updated to [x] after completion — the CLI had to track completion separately via SUMMARY.md presence
- Phase 2 (feature detection) was the simplest phase but required the most research upfront to decide on capabilities endpoint vs try-and-detect approach
- 3 UAT tests in Phase 1 were skipped because they required a live backend — could have been better covered by E2E mocks earlier

### Patterns Established
- `src/lib/` for non-component exports from route files (react-refresh lint compliance)
- Zod search schema pattern: define in lib/, import in route, test independently
- Capability-gated UI: Row 1 (always visible) + Row 2 (conditional on flags) pattern for progressive enhancement
- Filter chip derivation as pure function for testability
- E2E mock override pattern via `electionsListOverride` for configurable test scenarios

### Key Lessons
1. Feature-detection is a powerful pattern for frontend-first development — ship UI changes without backend dependency, let them activate automatically
2. Extracting non-component code from route files early prevents cascading lint issues and improves testability
3. Small milestones (3 phases, 5 plans) execute cleanly in 2 days with improving velocity — right-sizing scope matters

### Cost Observations
- Model mix: 100% quality profile (Opus)
- Sessions: ~4 sessions across 2 days
- Notable: Total execution time was 38 minutes for 5 plans — extremely efficient for the scope delivered

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~4 | 3 | First milestone — established baseline patterns |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 904 unit + 27 E2E | 95%+ | 0 (no new dependencies) |

### Top Lessons (Verified Across Milestones)

1. Feature-detection enables frontend-first development without backend blocking
2. Right-sized milestones (3-5 phases) maintain velocity and focus
