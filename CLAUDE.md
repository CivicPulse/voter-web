# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

voter-web is a React SPA frontend for the [voter-api](https://github.com/CivicPulse/voter-api) backend (FastAPI REST API at `/api/v1`). It builds to static files for deployment on Cloudflare Pages.

**Governance:** The [project constitution](.specify/memory/constitution.md) defines non-negotiable rules: branch-based development, PRs required, 95% test coverage, conventional commits.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — typecheck (`tsc -b`) then build to `dist/`
- `npm run lint` — ESLint
- `npm run preview` — serve production build locally
- `npm test` — run Vitest unit tests (watch mode)
- `npm test -- --run` — run unit tests once (CI mode)
- `npm run test:e2e` — run Playwright E2E tests (requires `npm run build` first)
- `npm run test:e2e:ui` — run E2E tests with Playwright interactive UI
- `npx shadcn@latest add <component>` — add a shadcn/ui component (e.g. `button`, `dialog`, `data-table`)

Requires Node.js LTS (use `nvm use` — reads `.nvmrc`).

## Environment Setup

```bash
nvm use
npm install
cp .env.example .env
npm run dev
```

Edit `.env` to configure `VITE_API_BASE_URL` (defaults to `http://localhost:8000/api/v1`).

For full-stack development with Docker Compose (requires voter-api cloned as sibling directory):

```bash
docker compose up
```

See [docs/setup-guide.md](docs/setup-guide.md) for Docker profiles and deployment details.

## Architecture

**Stack:** React 19, TypeScript 5.9+ (strict), Vite 7, Tailwind CSS v4, shadcn/ui (new-york style, neutral base color)

**Routing:** TanStack Router with file-based routing. Routes live in `src/routes/`. The Vite plugin auto-generates `src/routeTree.gen.ts` — never edit this file manually. Run `npx @tanstack/router-cli generate --target react` to regenerate outside dev server.

**Data fetching:** TanStack Query (`QueryClientProvider` wraps the app in `src/main.tsx`).

**Data tables:** TanStack Table (headless).

**Forms:** React Hook Form + Zod for validation.

**State:** Zustand for client state (auth tokens, geographic context).

**HTTP client:** `ky` configured in `src/api/client.ts` with JWT Bearer token from `localStorage("access_token")`. API base URL from `VITE_API_BASE_URL` env var. Two instances: `api` (authenticated) and `publicApi` (opportunistic auth).

**Maps:** React-Leaflet + Leaflet for geospatial visualization. Turf.js for geometric operations.

**Charts:** Recharts. **Drawer:** vaul. **Icons:** Lucide React. **Toasts:** Sonner.

## Key Conventions

- **Path alias:** `@/` maps to `src/`. Always use `@/` imports — never relative paths.
- **shadcn/ui components** go in `src/components/ui/`. Custom components go in `src/components/`.
- **CSS class merging:** use `cn()` from `@/lib/utils`.
- **Route files** must export `Route` using `createFileRoute()` or `createRootRoute()`.
- **Environment variables** must be prefixed with `VITE_` to be exposed to the client.
- `src/routeTree.gen.ts` is ignored by ESLint and marked read-only.
- **Named exports only.** Use `export type` for type-only exports.
- **Conventional commits:** `<type>(<scope>): <description>` — types: feat, fix, docs, style, refactor, test, chore, ci.

### URL Routing Patterns

The app supports multi-state, collision-free URL routing:

- **State pages:** `/$state` (e.g., `/ga`) — shows state map with county boundaries
- **County pages:** `/counties/$state/$county` (e.g., `/counties/ga/bibb`) — slug-based county detail
- **County pages (legacy):** `/counties/$countyId` — UUID-based, redirects to slug URL
- **State-level districts:** `/districts/$state/$type/$name` (e.g., `/districts/ga/state-senate/018`)
- **County-level districts:** `/districts/$state/$county/$type/$name` (e.g., `/districts/ga/bibb/county-commission/005`)
- **Legacy district slugs:** `/districts/$type/$name` — auto-redirects to fully-qualified URL
- **Legacy district UUID:** `/districts/$districtId` — still works directly

**Key conventions:**
- District scope: `county` field present = county-scoped, null = state-scoped
- State abbreviation derived from first 2 digits of `boundary_identifier` (FIPS code)
- URL slugs are lowercase, hyphenated (e.g., `county-commission`, `ben-hill`)
- `districtSlugPath()` in `src/lib/slugs.ts` generates fully-qualified district URLs
- Navigation context (Zustand store `src/stores/navigation-context.ts`) tracks geographic context

## Admin Features

Admin panel at `/admin/*` with role-based access control (admin/analyst roles). Features: user management, election management (CRUD + SOS feed import), data imports (voter CSV, boundary GeoJSON/ZIP), exports, batch geocoding, and district mismatch analysis.

Key patterns: auto-polling with `refetchInterval` for job monitoring, two-step confirmation dialogs, `AdminErrorBoundary` for error handling, `_components/` subdirectories for route-specific components.

See [docs/admin-guide.md](docs/admin-guide.md) for user-facing admin docs and [docs/development-guide.md](docs/development-guide.md) for admin architecture patterns.

## Static Assets & SPA Routing

**IMPORTANT:** When adding static assets to `public/`, add a redirect rule in `public/_redirects` **before** the `/*` catch-all, or the SPA fallback will serve `index.html` instead of the file:

```
/geojson/*  200
/*          /index.html  200
```

Build-time GeoJSON caching: `npm run build` runs `scripts/fetch-geojson.mjs` to pre-fetch boundary data to `public/geojson/`.

See [docs/setup-guide.md](docs/setup-guide.md) for full deployment details.

## Testing

- **Unit:** Vitest + jsdom + React Testing Library. Tests in `tests/`. Coverage: 95% threshold. Custom render: `src/test/render.tsx`. Mock factories: `src/test/mocks/`.
- **E2E:** Playwright + Chromium against `vite preview` (port 4173). Tests in `e2e/`. API intercepted via `page.route()` — no backend needed. Fixtures: `e2e/fixtures/`.
- **CI:** Unit tests in `deploy.yml` (lint → test → build → deploy). E2E in `e2e.yml`. Both on pushes/PRs to `main`.

See [docs/development-guide.md](docs/development-guide.md) for testing patterns and adding tests.

## Backend API

voter-api uses JWT auth (access + refresh tokens), role-based access (admin/analyst/viewer), and async job patterns (202 Accepted, poll for status).

**Key endpoints:** `/auth/login`, `/auth/refresh`, `/auth/me`, `/voters`, `/boundaries`, `/elections`, `/imports`, `/exports`, `/geocoding`, `/analysis`.

**API docs:** Swagger/OpenAPI at `/docs` on the API server (e.g., `http://localhost:8000/docs`).

**Census Bureau API:** [api.census.gov/data.html](https://api.census.gov/data.html) (demographics, geographic data).

## Git Workflow

**IMPORTANT:** Always create a feature branch before making any code changes. Never commit directly to `main` unless explicitly requested. Branch naming: `###-feature-name`.

Feature work, stories, and multi-step changes should be done on a feature branch off `main`. Commit after each logical step so progress is incremental and reviewable.

## UI Verification

After making **any** UI changes (components, layouts, styles, routes), you **must** visually verify the result using the Playwright MCP tools before considering the task complete:

1. Ensure the dev server is running (`npm run dev`).
2. Use `browser_navigate` to open the affected page(s) (e.g., `http://localhost:5173/...`).
3. Use `browser_snapshot` to capture the page's accessibility tree and confirm expected elements.
4. Use `browser_take_screenshot` to visually verify layout and styling. **Save screenshots to `screenshots/`** (gitignored).
5. For interactive changes, use Playwright actions (`browser_click`, `browser_hover`, etc.) and verify resulting state.

Do **not** mark a UI task as complete without this verification.

## Documentation Index

| Resource | Description |
|----------|-------------|
| [Constitution](.specify/memory/constitution.md) | Non-negotiable engineering principles |
| [User Guide](docs/user-guide.md) | End user documentation |
| [Admin Guide](docs/admin-guide.md) | Administrator documentation |
| [Setup Guide](docs/setup-guide.md) | Local dev, Docker, deployment |
| [Development Guide](docs/development-guide.md) | Architecture, conventions, testing |
| [Architecture](.planning/codebase/ARCHITECTURE.md) | Detailed architecture analysis |
| [Conventions](.planning/codebase/CONVENTIONS.md) | Coding convention analysis |

<!-- Managed by .specify/scripts/bash/update-agent-context.sh -->
## Active Technologies

<!-- Managed by .specify/scripts/bash/update-agent-context.sh -->
## Recent Changes
