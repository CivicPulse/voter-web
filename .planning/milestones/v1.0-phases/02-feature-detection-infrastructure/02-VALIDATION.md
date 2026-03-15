---
phase: 2
slug: feature-detection-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + @testing-library/react |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run && npm run test:e2e` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | INFRA-01 | unit | `npx vitest run tests/lib/election-capabilities.test.ts -t "mapCapabilitiesToFlags"` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | INFRA-01 | unit | `npx vitest run tests/lib/hooks/use-election-capabilities.test.ts -t "returns all false"` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | INFRA-01 | unit | `npx vitest run tests/lib/hooks/use-election-capabilities.test.ts -t "returns flags"` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | INFRA-01 | unit | `npx vitest run tests/routes/elections-search-schema.test.ts -t "strip unsupported"` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | INFRA-01 | e2e | `npx playwright test e2e/elections-list.spec.ts -g "feature detection"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | INFRA-02 | manual | Verify `.planning/API-SPEC.md` exists with all required sections | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/election-capabilities.test.ts` — stubs for INFRA-01 (mapping function)
- [ ] `tests/lib/hooks/use-election-capabilities.test.ts` — stubs for INFRA-01 (hook behavior)
- [ ] Extend `tests/routes/elections-search-schema.test.ts` — stubs for INFRA-01 (param stripping)
- [ ] Extend `e2e/elections-list.spec.ts` — stubs for INFRA-01 (conditional rendering)

*Existing test infrastructure covers framework installation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| API spec document completeness | INFRA-02 | Document review — content quality cannot be automated | Verify `.planning/API-SPEC.md` exists and covers: q, race_category, county, district, election_date params; capabilities endpoint; filter-options endpoint; request/response examples |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
