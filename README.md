# voter-web

A SPA web interface for the [voter-api](https://github.com/CivicPulse/voter-api) backend.

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** + **shadcn/ui** for UI components
- **TanStack Router** for type-safe routing
- **TanStack Query** for data fetching & caching
- **TanStack Table** for data tables
- **React Hook Form** + **Zod** for forms & validation
- **Zustand** for state management
- **React-Leaflet** for map visualization
- **Recharts** for charts

## Getting Started

```bash
nvm use
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
```

Upload the contents of `dist/` to your static host (S3, R2, etc.).
