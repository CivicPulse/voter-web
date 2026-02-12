# voter-web

A SPA web interface for the [voter-api](https://github.com/CivicPulse/voter-api) backend.

## Tech Stack

- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS v4** + **shadcn/ui** for UI components
- **TanStack Router** for type-safe file-based routing
- **TanStack Query** for data fetching & caching
- **TanStack Table** for data tables
- **React Hook Form** + **Zod** for forms & validation
- **Zustand** for state management
- **React-Leaflet** for map visualization
- **Recharts** for charts
- **ky** for HTTP requests

## Prerequisites

- **Node.js** LTS (managed via [nvm](https://github.com/nvm-sh/nvm) — see `.nvmrc`)

## Getting Started

```bash
nvm use
npm install
cp .env.example .env
npm run dev
```

The dev server starts at `http://localhost:5173` with hot module replacement.

## Environment Variables

| Variable            | Description        | Default                        |
| ------------------- | ------------------ | ------------------------------ |
| `VITE_API_BASE_URL` | voter-api base URL | `http://localhost:8000/api/v1` |

All client-exposed env vars must be prefixed with `VITE_`.

## Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start Vite dev server              |
| `npm run build`   | Typecheck and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint`    | Run ESLint                         |

## Project Structure

```text
src/
├── api/          # HTTP client and API endpoint definitions
├── components/
│   └── ui/       # shadcn/ui components
├── hooks/        # Custom React hooks
├── lib/          # Utility functions (cn, etc.)
├── routes/       # TanStack Router file-based routes
├── stores/       # Zustand state stores
├── types/        # TypeScript type definitions
└── main.tsx      # App entry point (Router + QueryClient providers)
```

## Adding UI Components

shadcn/ui components are added via the CLI and copied into `src/components/ui/`:

```bash
npx shadcn@latest add button
npx shadcn@latest add data-table
```

## Features

### Interactive County Map

The home page displays an interactive map of Georgia counties. Clicking a county navigates to its detail page.

### County Detail Page

Each county page (`/counties/:countyId`) shows:

- **County Map** — boundary visualization with selectable district overlays (congressional, state senate, state house, etc.) using a colorblind-friendly palette
- **County Information** — basic boundary data (name, FIPS identifier, source, dates) plus a **Geographic Details** section populated from the API's `county_metadata` field, which includes:
  - FIPS and GEOID codes
  - Land and water area (km² and mi²)
  - Internal point coordinates (lat/lon)
  - CBSA/CSA statistical area codes
  - Functional status
  - GNIS code
- **Voter Data & Analysis** — authenticated sections (requires sign-in)

## Build & Deploy

```bash
npm run build
```

This outputs static files to `dist/`. Upload the contents to your static host (S3, R2, etc.) and configure `index.html` as both the index and error document for SPA routing.
