---
phase: 1
slug: url-state-and-existing-filters
status: draft
nyquist_compliant: true
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
| 01-01-01 | 01 | 1 | URL-01, FILT-01 | unit | `npx vitest run tests/lib/date-presets.test.ts` | Plan 01 creates | pending |
| 01-01-02 | 01 | 1 | URL-02, URL-03, URL-04 | unit | `npx vitest run tests/routes/elections-search-schema.test.ts` | Plan 01 creates | pending |
| 01-02-01 | 02 | 2 | UX-01, UX-02, UX-03, UX-04 | unit | `npx vitest run tests/routes/elections-active-filters.test.ts` | Plan 02 creates | pending |
| 01-02-02 | 02 | 2 | FILT-02, FILT-03, FILT-04 | e2e | `npx playwright test e2e/elections-list.spec.ts` | Plan 02 creates | pending |
| 01-02-03 | 02 | 2 | URL-02, URL-03, URL-04 | e2e | `npx playwright test e2e/elections-list.spec.ts` | Plan 02 creates | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

All test files are created by their respective plan tasks during execution. No separate Wave 0 stub creation is needed because:

- Plan 01 Task 1 creates `tests/lib/date-presets.test.ts` (TDD — tests first)
- Plan 01 Task 2 creates `tests/routes/elections-search-schema.test.ts` (Step 13)
- Plan 02 Task 1 creates `tests/routes/elections-active-filters.test.ts` (Step 6)
- Plan 02 Task 2 creates `e2e/elections-list.spec.ts` and `e2e/fixtures/mock-data.ts`

Each task's `<verify>` command runs the tests that task creates, ensuring Nyquist compliance within each task.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Filter layout wraps naturally on small screens | FILT-04 | CSS flex-wrap visual verification | Resize browser to ~375px width, verify all filters wrap to multiple lines without overflow |
| Date preset dropdown label shows preset name | FILT-01 | Visual label content | Open date preset Select, verify label shows "Next 3 months" not computed dates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify commands that run tests created by that task
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] FILT-02 and FILT-03 covered by E2E tests (Plan 02 Task 2), not date-presets.test.ts

**Approval:** pending
