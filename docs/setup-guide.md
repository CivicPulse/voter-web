# Setup & Deployment Guide

How to set up, build, and deploy CivicPulse Voter Data Explorer.

## Prerequisites

- **Node.js LTS** — managed via [nvm](https://github.com/nvm-sh/nvm) (version specified in `.nvmrc`)
- **npm** — included with Node.js
- **Git** — for cloning the repository

## Local Development Setup

### Quick Start

```bash
git clone https://github.com/CivicPulse/voter-web.git
cd voter-web
nvm use
npm install
cp .env.example .env
npm run dev
```

The dev server starts at `http://localhost:5173` with hot module replacement.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | voter-api backend URL | `http://localhost:8000/api/v1` |

All client-exposed environment variables must be prefixed with `VITE_` (Vite requirement).

Edit `.env` to point to your voter-api instance. The default assumes the API is running locally on port 8000.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Typecheck (`tsc -b`) then build to `dist/` |
| `npm run preview` | Serve production build locally (port 4173) |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest unit tests (watch mode) |
| `npm test -- --run` | Run unit tests once (CI mode) |
| `npm run test:coverage` | Run unit tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests (requires build first) |
| `npm run test:e2e:ui` | Run E2E tests with Playwright interactive UI |

---

## Docker Compose Development

The project includes Docker Compose configuration for running the full stack (frontend + backend) or just the frontend.

### Full-Stack Setup

Requires the [voter-api](https://github.com/CivicPulse/voter-api) repository cloned as a sibling directory:

```
projects/
  voter-api/    # Backend (includes its own docker-compose.yml)
  voter-web/    # This repo
```

```bash
docker compose up
```

This starts:
- **voter-web** on port 5173 (with HMR via volume mount)
- **voter-api** and its dependencies (PostgreSQL, Redis, etc.)

### Frontend-Only

To run just the frontend in Docker (connecting to an external API):

```bash
docker compose --profile local up web-local
```

Edit the `VITE_API_BASE_URL` environment variable in `docker-compose.yml` to point to your API server.

---

## Production Build

### Build Process

```bash
npm run build
```

This runs two steps:
1. **GeoJSON caching** — `scripts/fetch-geojson.mjs` fetches boundary GeoJSON from the API and saves it to `public/geojson/` as static files
2. **Vite build** — TypeScript compilation (`tsc -b`) then Vite bundling to `dist/`

The output in `dist/` is a set of static files (HTML, JS, CSS, assets) ready for any static hosting service.

### GeoJSON Caching

The build script pre-fetches boundary data from the API so the deployed app can load map data instantly without waiting for API calls. These files are placed in `public/geojson/` and included in the build output.

> **Note:** The API must be accessible at build time for GeoJSON caching to work. If the API is unavailable, the build continues but map data will be fetched at runtime instead.

---

## SPA Routing Configuration

The app is a Single Page Application — all routes are handled client-side by TanStack Router. The hosting platform must be configured to serve `index.html` for all non-file requests.

### Cloudflare Pages / Netlify

The `public/_redirects` file handles this:

```
/geojson/*  200
/*          /index.html  200
```

### Adding Static Assets

When adding new static files to `public/` (JSON, images, fonts, etc.), you **must** add a redirect rule **before** the `/*` catch-all:

```
/data/*     200
/fonts/*    200
/geojson/*  200
/*          /index.html  200
```

Without this, the SPA catch-all serves `index.html` instead of the actual static file.

---

## Deployment

### GitHub Actions CI/CD (Recommended)

The project uses two GitHub Actions workflows:

**Build & Deploy** (`.github/workflows/deploy.yml`):
1. Lint → Unit tests → Build
2. **Production:** Pushes to `main` deploy to Cloudflare Pages at `https://vote.civpulse.org/`
3. **Preview:** Pull requests get automatic preview deployments with URLs posted as PR comments

**E2E Tests** (`.github/workflows/e2e.yml`):
1. Build → Install Playwright → Run E2E tests
2. Uploads test reports and traces as artifacts
3. Runs on pushes to `main` and PRs to `main`

**Required Secrets and Variables:**

| Name | Type | Description |
|------|------|-------------|
| `CLOUDFLARE_API_TOKEN` | Secret | Cloudflare API token with Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | Cloudflare account identifier |
| `VITE_API_BASE_URL` | Build env | Set to production API URL in workflow |

### Manual Deployment

For manual deployment to Cloudflare Pages:

```bash
npm run build
npx wrangler pages deploy dist/ --project-name=voter-web
```

Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` environment variables.

---

## Backend API Connection

The frontend connects to the [voter-api](https://github.com/CivicPulse/voter-api) backend — a FastAPI REST API.

### Authentication

- JWT Bearer tokens (access + refresh)
- Access tokens are short-lived; the frontend automatically refreshes them on 401 responses
- Tokens stored in `localStorage`

### Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login` | Authenticate and receive tokens |
| `POST /auth/refresh` | Refresh access token |
| `GET /auth/me` | Current user profile and role |
| `GET /voters` | Search voter records (authenticated) |
| `GET /voters/{id}` | Voter detail (authenticated) |
| `GET /boundaries` | List/search boundaries |
| `GET /boundaries/{id}` | Boundary detail with GeoJSON |
| `GET /elections` | List/search elections (public) |
| `GET /elections/{id}` | Election detail with races |
| `GET /elections/{id}/results` | Race results |
| `POST /imports/*` | Create import jobs (admin) |
| `POST /exports` | Create export jobs (admin) |
| `POST /geocoding/batch` | Trigger batch geocoding (admin) |
| `POST /analysis` | Trigger district analysis (admin) |

### Async Job Pattern

Long-running operations (imports, exports, geocoding, analysis) return `202 Accepted` with a job ID. The frontend polls for status updates using TanStack Query's `refetchInterval`.

### API Documentation

Interactive Swagger/OpenAPI docs are available at `/docs` on the API server (e.g., `http://localhost:8000/docs`).

---

## Monitoring

### Build Status

Check the GitHub Actions tab for build and test results. The deploy workflow runs: lint → test → build → deploy.

### E2E Test Artifacts

When E2E tests fail, Playwright uploads:
- **Test report** — HTML report viewable in browser (retained 7 days)
- **Test traces** — detailed execution traces for debugging (retained 7 days on failure)

---

## Security Considerations

- **Environment variables:** Never commit `.env` files. Only `VITE_`-prefixed variables are exposed to the client bundle
- **JWT storage:** Tokens are stored in `localStorage`. This is standard for SPAs but means they're accessible to JavaScript
- **CORS:** The API must allow requests from the frontend's origin
- **Static assets:** The production build contains no server-side code or secrets
- **File uploads:** Client-side validation enforces file type and 100 MB size limit, but server-side validation is the actual security boundary
