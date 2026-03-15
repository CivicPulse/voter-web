# Technology Stack

**Analysis Date:** 2026-03-13

## Languages

**Primary:**
- TypeScript 5.9+ (strict mode) - Full codebase with comprehensive type safety
- React 19.2+ - UI framework with Concurrent features

**Secondary:**
- JavaScript (ES2022+) - Node.js scripts (build automation)

## Runtime

**Environment:**
- Node.js LTS (configured via `.nvmrc`)
- Browser: Chrome/Chromium (tested via Playwright)

**Package Manager:**
- npm 10+ (inferred from `.nvmrc` and workflow)
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core UI:**
- React 19.2.0 - Component framework
- TanStack Router 1.159.5 - File-based routing via Vite plugin (`src/routes/`)
- TanStack Query 5.90.21 - Server state management & caching
- TanStack Table 8.21.3 - Headless data table

**Styling:**
- Tailwind CSS 4.1.18 - Utility-first CSS
- @tailwindcss/vite 4.1.18 - Build plugin for CSS optimization
- tailwind-merge 3.4.0 - Class merging utility
- class-variance-authority 0.7.1 - Type-safe variant patterns

**Client State:**
- Zustand 5.0.11 - Lightweight state management (auth, navigation context)

**Forms & Validation:**
- React Hook Form 7.71.1 - Form state & performance
- Zod 4.3.6 - Schema validation (TypeScript-first)
- @hookform/resolvers 5.2.2 - RHF validation resolver

**UI Components:**
- shadcn/ui (latest, installed via `npx shadcn@latest add`) - Accessible component library (new-york style, neutral base)
- Radix UI 1.4.3 - Primitive components (used by shadcn/ui)
- cmdk 1.1.1 - Command palette/autocomplete
- vaul 1.1.2 - Mobile-friendly drawer component
- Lucide React 0.563.0 - Icon library
- Sonner 2.0.7 - Toast notifications
- next-themes 0.4.6 - Theme switching (light/dark mode)

**Geospatial:**
- React-Leaflet 5.0.0 - React wrapper for Leaflet
- Leaflet 1.9.4 - Map library
- Turf.js 7.3.4 (submodules):
  - @turf/bbox - Bounding box calculation
  - @turf/boolean-intersects - Geometric intersection detection
  - @turf/helpers - GeoJSON utilities

**Data Visualization:**
- Recharts 3.7.0 - React charting library

**HTTP Client:**
- ky 1.14.3 - Lightweight fetch wrapper (custom configured in `src/api/client.ts`)
- Includes: JWT Bearer token attachment, automatic retry logic, 401/403 error handling

## Build Tools

**Build System:**
- Vite 7.3.1 - Next-gen build tool & dev server
- @vitejs/plugin-react 5.1.1 - React Fast Refresh
- @tanstack/router-plugin 1.159.5 - Auto-generates `src/routeTree.gen.ts` from routes

**TypeScript:**
- typescript 5.9.3 - Language compiler (strict mode enforced)
- tsc -b (composite project) - Incremental builds

**Testing:**
- Vitest 4.0.18 - Vite-native unit test runner
- @vitest/ui 4.0.18 - Web UI for test results
- @vitest/coverage-v8 4.0.18 - Code coverage (v8 provider)
- jsdom 28.0.0 - DOM environment
- @testing-library/react 16.3.2 - React component testing
- @testing-library/jest-dom 6.9.1 - DOM assertions
- @testing-library/user-event 14.6.1 - User interaction simulation
- Playwright 1.58.2 (@playwright/test) - E2E browser automation

**Linting & Code Quality:**
- ESLint 9.39.1 - JavaScript/TypeScript linter
- @eslint/js 9.39.1 - ESLint core config
- typescript-eslint 8.48.0 - TypeScript support
- eslint-plugin-react-hooks 7.0.1 - React Hooks rules
- eslint-plugin-react-refresh 0.4.24 - Fast Refresh rules
- globals 16.5.0 - Global variable definitions

**Code Generation:**
- @tanstack/router-cli (implicit) - Route tree generation
- shadcn/ui CLI - Component scaffolding

## Key Dependencies

**Critical Infrastructure:**
- ky 1.14.3 - HTTP client (JWT-aware, retry-enabled, rate-limited)
- zustand 5.0.11 - Auth token & role state
- zod 4.3.6 - Type-safe API response validation

**Data Fetching & Caching:**
- @tanstack/react-query 5.90.21 - Server state with stale-while-revalidate, polling support

**Geospatial Operations:**
- React-Leaflet 5.0.0 + Leaflet 1.9.4 - Interactive map rendering
- Turf.js 7.3.4 - Geometric computations (intersections, bounding boxes, feature helpers)

**UI/UX:**
- shadcn/ui - Accessible components (Dialog, Select, Input, Badge, Command/Popover, DataTable)
- Recharts 3.7.0 - Election result charts (if used)
- Sonner 2.0.7 - Error/success notifications

## Configuration Files

**TypeScript:**
- `tsconfig.json` - Root composite config
- `tsconfig.app.json` - App-specific settings (strict: true, path aliases)
- `tsconfig.node.json` - Build script settings

**Build/Dev:**
- `vite.config.ts` - Vite configuration (plugins, resolver, dev proxy)
- `vitest.config.ts` - Test runner (jsdom, globals, coverage thresholds at 95%)
- `playwright.config.ts` - E2E browser tests (Chromium, baseURL: http://localhost:4173)

**Linting:**
- `eslint.config.js` - ESLint rules

**Deployment:**
- `.github/workflows/deploy.yml` - CI/CD pipeline (lint → test → build → Cloudflare Pages deploy)
- `.github/workflows/e2e.yml` - E2E tests on Vite preview server
- `public/_redirects` - SPA routing (Cloudflare Pages format)

## Environment Configuration

**Development:**
- `.env.example` → `.env` (copy before first run)
- `VITE_API_BASE_URL` - API base URL (defaults to `http://localhost:8000/api/v1`)
- Dev server proxy: `/api` → `http://localhost:8000` (vite.config.ts)

**Build-Time:**
- GeoJSON fetch: `scripts/fetch-geojson.mjs` runs pre-build to cache boundary files in `public/geojson/`
- API URL override: CI sets `VITE_API_BASE_URL: https://voteapi.civpulse.org/api/v1` for production builds

**Runtime:**
- All environment variables must be prefixed with `VITE_` to be exposed to client
- Secrets stored via GitHub Actions secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)

## Platform Requirements

**Development:**
- Node.js LTS (matches `.nvmrc`)
- npm 10+ for latest lockfile format
- Browser with ES2022+ support for dev server

**Production:**
- Static file hosting: Cloudflare Pages (automatic via GitHub Actions)
- No backend runtime required (SPA - all data from voter-api REST)
- Browser with ES2022+ support

**Build Output:**
- `npm run build` produces static files in `dist/`
- All assets (JS, CSS, GeoJSON) are pre-built for CDN delivery

---

*Stack analysis: 2026-03-13*
