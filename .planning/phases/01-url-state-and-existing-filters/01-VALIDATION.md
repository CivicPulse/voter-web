---
phase: 1
slug: url-state-and-existing-filters
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + jsdom + React Testing Library 16.3.2 (unit), Playwright (E2E) |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run && npx playwright test e2e/elections-list.spec.ts` |
| **Estimated runtime** | ~15 seconds (unit), ~30 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run && npx playwright test e2e/elections-list.spec.ts`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | URL-01 | unit | `npx vitest run tests/lib/date-presets.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 0 | FILT-01 | unit | `npx vitest run tests/lib/date-presets.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 0 | URL-02, URL-03, URL-04 | e2e | `npx playwright test e2e/elections-list.spec.ts` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 0 | UX-01, UX-02, UX-03, UX-04 | e2e | `npx playwright test e2e/elections-list.spec.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | URL-01 | unit | `npx vitest run tests/lib/date-presets.test.ts -t "schema"` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | FILT-01 | unit | `npx vitest run tests/lib/date-presets.test.ts -t "preset"` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | FILT-02, FILT-03, FILT-04 | e2e | `npx playwright test e2e/elections-list.spec.ts -g "filter"` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 1 | UX-01, UX-02, UX-03, UX-04 | e2e | `npx playwright test e2e/elections-list.spec.ts -g "chips"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/date-presets.test.ts` — stubs for FILT-01 (date preset resolution) and URL-01 (Zod schema validation)
- [ ] `e2e/elections-list.spec.ts` — expand existing file with filter-specific tests for URL-02, URL-03, URL-04, UX-01 through UX-04
- [ ] `e2e/fixtures/mock-data.ts` — add mock election data with date ranges, registration/early voting metadata

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Filter layout wraps naturally on small screens | FILT-04 | CSS flex-wrap visual verification | Resize browser to ~375px width, verify all filters wrap to multiple lines without overflow |
| Date preset dropdown label shows preset name | FILT-01 | Visual label content | Open date preset Select, verify label shows "Next 3 months" not computed dates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
