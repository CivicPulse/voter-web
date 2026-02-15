<!--
Sync Impact Report
==================
Version: 0.0.0 → 1.0.0 (INITIAL CONSTITUTION)
Rationale: Initial constitution creation with branch-based workflow and test coverage principles

Principles Established:
- NEW: I. Branch-Based Development (Non-Negotiable)
- NEW: II. Pull Request Review (Required)
- NEW: III. Test Coverage Standard (95% Unit Test Coverage)
- NEW: IV. Code Quality & Maintainability

Sections Added:
- Core Principles
- Development Workflow
- Quality Standards
- Governance

Templates Status:
- ✅ plan-template.md — aligned (constitution check section references this file)
- ✅ spec-template.md — aligned (user stories support branch-based delivery)
- ✅ tasks-template.md — aligned (task structure supports incremental commits per principle)

Follow-up TODOs: None
-->

# voter-web Constitution

A living document defining the non-negotiable engineering principles for the voter-web project.

## Core Principles

### I. Branch-Based Development (Non-Negotiable)

All work MUST be done on a feature branch created from `main`. Direct commits to `main` are prohibited unless explicitly requested by a project maintainer.

**Requirements:**
- Create a feature branch at the start of work, not after changes are made
- Branch naming convention: `###-feature-name` (numeric prefix for traceability)
- All feature work, stories, and multi-step changes must use feature branches
- Commit after each logical step for incremental, reviewable progress

**Rationale:** Branch-based development enables code review, testing in isolation, and safe rollback. It protects the main branch from incomplete or untested code and supports parallel development without conflicts.

### II. Pull Request Review (Required)

All code MUST be merged into `main` via GitHub Pull Request with review and approval before merge.

**Requirements:**
- Every feature branch MUST be merged via PR
- PRs MUST include clear description of changes and testing performed
- PRs MUST pass all automated checks (linting, type checking, builds)
- PRs MUST be reviewed and approved before merge
- Constitution compliance MUST be verified during review

**Rationale:** Pull requests enable peer review, knowledge sharing, and quality gates. They create an audit trail of changes and ensure multiple eyes review code before it reaches production.

### III. Test Coverage Standard (95% Unit Test Coverage)

All new code MUST achieve 95% unit test coverage before merge.

**Requirements:**
- New functions, components, and modules MUST have corresponding unit tests
- Tests MUST be written to achieve minimum 95% line coverage
- Coverage MUST be measured and verified before PR approval
- Tests MUST be meaningful and test actual behavior, not just execute code
- Edge cases and error conditions MUST be tested

**Rationale:** High test coverage ensures code quality, enables confident refactoring, and catches bugs early. The 95% threshold balances thoroughness with pragmatism (some code paths may be impractical to test).

### IV. Code Quality & Maintainability

Code MUST be clean, maintainable, and follow established project conventions.

**Requirements:**
- Use `@/` path alias for all imports (maps to `src/`)
- Follow TypeScript strict mode requirements
- Use ESLint and format code consistently
- Leverage shadcn/ui components in `src/components/ui/` for UI elements
- Use established patterns: TanStack Router for routing, TanStack Query for data fetching, Zustand for state
- Document complex logic with inline comments
- Avoid over-engineering: only make changes directly requested or clearly necessary

**Rationale:** Consistent code quality reduces cognitive load, speeds up onboarding, and minimizes technical debt. Following established patterns ensures the codebase remains cohesive as it grows.

## Development Workflow

### Branch Creation & Commits

1. **Start with a branch:** Create feature branch from `main` before any code changes
2. **Incremental commits:** Commit after each logical step with clear, conventional commit messages
3. **Keep branches focused:** One feature/fix per branch for easier review
4. **Stay up to date:** Regularly sync with `main` to minimize merge conflicts

### Pull Request Process

1. **Create PR:** Open PR against `main` with descriptive title and body
2. **Automated checks:** Ensure all CI checks pass (linting, type checking, build)
3. **Review:** Request review from team member(s)
4. **Address feedback:** Make requested changes and push updates
5. **Approval & merge:** Once approved and checks pass, merge to `main`
6. **Deployment:** Merged PRs automatically deploy to production via GitHub Actions

### Commit Message Format

Use Conventional Commits format for all commits and PR titles:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`

**Example:** `feat(counties): add geographic details section to county page`

## Quality Standards

### Testing Requirements

- **Unit tests:** 95% minimum coverage for new code
- **Test framework:** Configured but not yet implemented (to be established)
- **UI verification:** After UI changes, visually verify using Playwright MCP tools (dev server screenshots/snapshots)
- **Manual testing:** Test user-facing changes in dev environment before PR

### Code Review Checklist

Reviewers MUST verify:
- ✅ Constitution compliance (all principles followed)
- ✅ Tests present and coverage ≥ 95%
- ✅ Code follows project conventions and patterns
- ✅ No direct `main` commits (branch-based workflow followed)
- ✅ PR description clearly explains changes
- ✅ Automated checks (ESLint, TypeScript, build) pass
- ✅ No over-engineering or unnecessary complexity
- ✅ Security vulnerabilities addressed (no XSS, injection, etc.)

### Technology Constraints

- **React 19** + **TypeScript** + **Vite 7** (no deviations without discussion)
- **Node.js LTS** (version in `.nvmrc`)
- Use `npm` for package management (not yarn/pnpm unless project migrates)
- Follow Tailwind CSS v4 utility-first approach
- Use shadcn/ui components for UI consistency

## Governance

### Authority & Compliance

This constitution supersedes all other development practices and guidelines. When conflicts arise between this document and other guidance (README, CLAUDE.md, etc.), the constitution takes precedence.

**All pull requests and code reviews MUST verify compliance with this constitution.** Non-compliance MUST be addressed before merge.

### Amendments

Constitution amendments require:

1. **Proposal:** Document proposed changes with rationale
2. **Discussion:** Team review and consensus on necessity
3. **Version bump:** Semantic versioning (MAJOR.MINOR.PATCH) based on change type:
   - **MAJOR:** Backward incompatible governance or principle removals/redefinitions
   - **MINOR:** New principle added or material expansion of guidance
   - **PATCH:** Clarifications, wording, typo fixes, non-semantic refinements
4. **Migration plan:** If changes affect existing code, document migration strategy
5. **Documentation update:** Update this file and all dependent templates
6. **Approval:** Merge via standard PR process

### Complexity Justification

Any deviation from simplicity principles MUST be justified in writing:

- Document why the complexity is necessary
- Explain why simpler alternatives were rejected
- Record decision in feature plan's "Complexity Tracking" section

### Runtime Development Guidance

For day-to-day development guidance (commands, patterns, component usage), refer to:

- `/home/kwhatcher/projects/civicpulse/voter-web/CLAUDE.md` — Project-specific guidance for Claude Code
- `README.md` — Setup, commands, and architecture overview
- Interactive API docs at `/docs` on voter-api server

**Version**: 1.0.0 | **Ratified**: 2026-02-14 | **Last Amended**: 2026-02-14
