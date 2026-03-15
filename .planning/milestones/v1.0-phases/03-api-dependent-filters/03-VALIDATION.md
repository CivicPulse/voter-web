---
phase: 3
slug: api-dependent-filters
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 (unit) + Playwright 1.58.2 (E2E) |
| **Config file** | `vitest.config.ts` + `playwright.config.ts` |
| **Quick run command** | `npx vitest run tests/routes/elections-search-schema.test.ts tests/routes/elections-active-filters.test.ts tests/lib/api/elections.test.ts` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/routes/elections-search-schema.test.ts tests/routes/elections-active-filters.test.ts tests/lib/api/elections.test.ts`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | API-01-04 | unit | `npx vitest run tests/routes/elections-search-schema.test.ts` | ✅ extend | ⬜ pending |
| 03-01-02 | 01 | 0 | API-01-04 | unit | `npx vitest run tests/routes/elections-active-filters.test.ts` | ✅ extend | ⬜ pending |
| 03-01-03 | 01 | 0 | API-05 | unit | `npx vitest run tests/lib/hooks/use-filter-options.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 0 | API-05 | unit | `npx vitest run tests/lib/api/elections.test.ts` | ✅ extend | ⬜ pending |
| 03-02-01 | 02 | 1 | API-01 | unit | `npx vitest run tests/routes/elections-search-schema.test.ts` | ✅ extend | ⬜ pending |
| 03-02-02 | 02 | 1 | API-02 | unit | `npx vitest run tests/routes/elections-search-schema.test.ts` | ✅ extend | ⬜ pending |
| 03-02-03 | 02 | 1 | API-03 | unit | `npx vitest run tests/routes/elections-search-schema.test.ts` | ✅ extend | ⬜ pending |
| 03-02-04 | 02 | 1 | API-04 | unit | `npx vitest run tests/routes/elections-search-schema.test.ts` | ✅ extend | ⬜ pending |
| 03-02-05 | 02 | 1 | API-05 | unit | `npx vitest run tests/lib/hooks/use-filter-options.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | API-01-05 | E2E | `npx playwright test e2e/elections-list.spec.ts` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `tests/routes/elections-search-schema.test.ts` — stubs for `q`, `race`, `county`, `election_date` Zod fields (API-01-04)
- [ ] Extend `tests/routes/elections-active-filters.test.ts` — stubs for new chip types (API-01-04)
- [ ] `tests/lib/hooks/use-filter-options.test.ts` — new file, stubs for filter-options hook (API-05)
- [ ] Extend `tests/lib/api/elections.test.ts` — stubs for `getFilterOptions` (API-05)
- [ ] Extend `e2e/fixtures/mock-data.ts` — capabilities + filter-options mock data
- [ ] Extend `e2e/fixtures/election-api.ts` — capabilities + filter-options route interception

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Search spinner appears during debounce | API-01 | Visual animation timing | Type in search, verify spinner replaces icon within 300ms |
| County combobox keyboard navigation | API-04 | Complex keyboard interaction | Tab to county filter, type "Bibb", arrow down, Enter |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
