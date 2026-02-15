# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

voter-web is a React SPA frontend for the [voter-api](https://github.com/CivicPulse/voter-api) backend (FastAPI REST API at `/api/v1`). It builds to static files for deployment on S3/R2.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — typecheck (`tsc -b`) then build to `dist/`
- `npm run lint` — ESLint
- `npm run preview` — serve production build locally
- `npx shadcn@latest add <component>` — add a shadcn/ui component (e.g. `button`, `dialog`, `data-table`)

Requires Node.js LTS (use `nvm use` — reads `.nvmrc`).

## Environment Setup

Copy `.env.example` to `.env` before first run:

```bash
cp .env.example .env
```

Edit `.env` to configure the API base URL if needed (defaults to `http://localhost:8000/api/v1`).

## Architecture

**Stack:** React 19, TypeScript, Vite 7, Tailwind CSS v4, shadcn/ui (new-york style, neutral base color)

**Routing:** TanStack Router with file-based routing. Routes live in `src/routes/`. The Vite plugin auto-generates `src/routeTree.gen.ts` — never edit this file manually. Run `npx @tanstack/router-cli generate --target react` to regenerate outside dev server.

**Data fetching:** TanStack Query (`QueryClientProvider` wraps the app in `src/main.tsx`).

**Data tables:** TanStack Table (headless).

**Forms:** React Hook Form + Zod for validation.

**State:** Zustand for client state (auth tokens, etc.).

**HTTP client:** `ky` configured in `src/api/client.ts` with JWT Bearer token from `localStorage("access_token")`. API base URL from `VITE_API_BASE_URL` env var (defaults to `http://localhost:8000/api/v1`).

**Maps:** React-Leaflet + Leaflet for geospatial visualization.

**Geospatial utilities:** Turf.js (`@turf/bbox`, `@turf/boolean-intersects`, `@turf/helpers`) for geometric operations.

**Charts:** Recharts.

**Drawer component:** vaul for mobile-friendly drawer UI.

## Key Conventions

- **Path alias:** `@/` maps to `src/` (configured in tsconfig and vite.config.ts). Always use `@/` imports.
- **shadcn/ui components** go in `src/components/ui/`. Custom components go in `src/components/`.
- **CSS class merging:** use `cn()` from `@/lib/utils` to merge Tailwind classes.
- **Icons:** Lucide React (`lucide-react`).
- **Route files** must export `Route` using `createFileRoute()` or `createRootRoute()`.
- **Environment variables** must be prefixed with `VITE_` to be exposed to the client.
- `src/routeTree.gen.ts` is ignored by ESLint and marked read-only in VSCode.
- **Map visualization:** District overlays use a colorblind-friendly color palette. Double-click on a district to navigate to its detail page.

## Static Assets, Build & Deployment

### Build-time GeoJSON Caching

The `npm run build` command runs `scripts/fetch-geojson.mjs` before the Vite build. This script fetches boundary GeoJSON data from the API and saves it to `public/geojson/` as static files for fast load times and offline resilience.

### Deployment

Deployments are handled automatically by GitHub Actions (`.github/workflows/deploy.yml`):

- **Production:** Pushes to `main` deploy to Cloudflare Pages at `https://vote.civpulse.org/`
- **Preview:** Pull requests get automatic preview deployments with URLs posted as PR comments
- **Manual:** `npx wrangler pages deploy dist/ --project-name=voter-web` (requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`)

The `npm run deploy` script exists but is deprecated in favor of GitHub Actions.

### SPA Routing

The app is deployed as an SPA using `public/_redirects` (Cloudflare Pages / Netlify format). This file controls how the hosting platform routes requests:

```
# Don't redirect static GeoJSON files
/geojson/*  200

# SPA fallback for everything else
/*  /index.html  200
```

**IMPORTANT:** When adding new static assets (JSON, images, fonts, etc.) to `public/`, ensure they are **excluded from the catch-all redirect** by adding specific rules **before** the `/*` rule. Rules are processed top-to-bottom, so more specific paths must come first.

Example for adding other static content:
```
/data/*     200
/fonts/*    200
/geojson/*  200
/*          /index.html  200
```

Without these exclusions, the SPA catch-all will serve `index.html` (HTML content) instead of the actual static files, causing the browser to receive the wrong content type.

## Testing

No automated test suite is currently configured. The project uses Playwright as a dev dependency for UI verification during development (see UI Verification section below), but automated tests have not been set up.

## Backend API

The voter-api uses JWT auth (access + refresh tokens), role-based access (admin/analyst/viewer), and async job patterns (returns 202 Accepted, poll for status). Key resource endpoints: `/voters`, `/boundaries`, `/imports`, `/geocoding`, `/analysis`, `/exports`.

Interactive API documentation (Swagger/OpenAPI) is available at `/docs` on the API server (e.g., `http://localhost:8000/docs`).

### US Census Bureau API

The US Census Bureau Statistical Data API provides demographic, economic, and geographic data. Documentation is available at:

- Human-readable: <https://api.census.gov/data.html>
- Machine-readable (JSON): <https://api.census.gov/data.json>

### Boundary Detail Response

`GET /boundaries/{id}` returns a `BoundaryDetailResponse` which includes a `county_metadata` field (nullable) containing Census TIGER/Line geographic metadata for county boundaries. This metadata is typed as `CountyMetadata` in `src/types/boundary.ts` and includes FIPS codes, GEOID, land/water area (m² and km²), CBSA/CSA codes, functional status, GNIS code, and internal point coordinates.

The county detail page (`src/routes/counties/$countyId.tsx`) displays this metadata in a "Geographic Details" subsection within the County Information card. Area values are shown in both km² and mi² (converted client-side). Functional status codes are mapped to human-readable labels via `functionalStatusLabels`.

## Git Workflow

**IMPORTANT:** Always create a feature branch before making any code changes. Never commit directly to `main` unless the user explicitly requests it. Create the branch at the start of work, not after changes are made.

Feature work, stories, and multi-step changes should be done on a feature branch off `main`. Commit after each logical step so progress is incremental and reviewable.

## UI Verification

After making **any** UI changes (components, layouts, styles, routes), you **must** visually verify the result using the Playwright MCP tools before considering the task complete:

1. Ensure the dev server is running (`npm run dev`).
2. Use `browser_navigate` to open the affected page(s) (e.g., `http://localhost:5173/...`).
3. Use `browser_snapshot` to capture the page's accessibility tree and confirm the expected elements are present.
4. Use `browser_take_screenshot` to visually verify layout, styling, and overall appearance.
5. If the change involves interaction (hover, click, form input), use the appropriate Playwright actions (`browser_click`, `browser_hover`, `browser_fill_form`, etc.) and verify the resulting state.

Do **not** mark a UI task as complete without performing this verification. If the visual result does not match expectations, fix the issue and re-verify before proceeding.

## Active Technologies
- TypeScript 5.8+ (strict mode), React 19.2+ (001-admin-api-access)

## Recent Changes
- 001-admin-api-access: Added TypeScript 5.8+ (strict mode), React 19.2+
