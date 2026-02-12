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

## Architecture

**Stack:** React 19, TypeScript, Vite 7, Tailwind CSS v4, shadcn/ui (new-york style, neutral base color)

**Routing:** TanStack Router with file-based routing. Routes live in `src/routes/`. The Vite plugin auto-generates `src/routeTree.gen.ts` — never edit this file manually. Run `npx @tanstack/router-cli generate --target react` to regenerate outside dev server.

**Data fetching:** TanStack Query (`QueryClientProvider` wraps the app in `src/main.tsx`).

**Data tables:** TanStack Table (headless).

**Forms:** React Hook Form + Zod for validation.

**State:** Zustand for client state (auth tokens, etc.).

**HTTP client:** `ky` configured in `src/api/client.ts` with JWT Bearer token from `localStorage("access_token")`. API base URL from `VITE_API_BASE_URL` env var (defaults to `http://localhost:8000/api/v1`).

**Maps:** React-Leaflet + Leaflet for geospatial visualization.

**Charts:** Recharts.

## Key Conventions

- **Path alias:** `@/` maps to `src/` (configured in tsconfig and vite.config.ts). Always use `@/` imports.
- **shadcn/ui components** go in `src/components/ui/`. Custom components go in `src/components/`.
- **CSS class merging:** use `cn()` from `@/lib/utils` to merge Tailwind classes.
- **Icons:** Lucide React (`lucide-react`).
- **Route files** must export `Route` using `createFileRoute()` or `createRootRoute()`.
- **Environment variables** must be prefixed with `VITE_` to be exposed to the client.
- `src/routeTree.gen.ts` is ignored by ESLint and marked read-only in VSCode.

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
