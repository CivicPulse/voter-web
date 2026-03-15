# AGENTS.md

Instructions for AI coding assistants working on voter-web.

## Project Overview

voter-web is a React SPA frontend for [voter-api](https://github.com/CivicPulse/voter-api) (FastAPI REST API at `/api/v1`). It displays voter data, election results, political boundaries, and demographics on interactive maps. Builds to static files deployed on Cloudflare Pages.

**Governance:** The [project constitution](.specify/memory/constitution.md) defines non-negotiable principles. Key rules: branch-based development (never commit to `main`), PRs required, 95% test coverage, conventional commits.

## Source Structure

```
src/
├── api/          # HTTP clients (ky with JWT hooks)
├── components/   # Feature components + ui/ (shadcn/ui)
├── hooks/        # Reusable hooks (boundaries, slugs, voters)
├── lib/
│   ├── api/      # API wrapper functions
│   ├── hooks/    # TanStack Query hooks
│   ├── schemas/  # Zod validation schemas
│   └── utils/    # Utility functions
├── routes/       # TanStack Router file-based routes
├── stores/       # Zustand state stores
├── types/        # TypeScript type definitions
└── main.tsx      # App entry (Router + QueryClient providers)
tests/            # Unit tests (mirrors src/)
e2e/              # Playwright E2E tests
```

## Commands

```bash
npm run dev          # Vite dev server (port 5173)
npm run build        # Typecheck + build to dist/
npm run lint         # ESLint
npm test -- --run    # Unit tests (single run)
npm run test:e2e     # E2E tests (requires build first)
```

## Key Patterns

### Adding a Page

1. Create route file in `src/routes/` exporting `Route` via `createFileRoute()`
2. Validate search params with Zod via `validateSearch`
3. Fetch data with TanStack Query hooks
4. Use shadcn/ui components and `cn()` for styling

### Adding a Component

1. Place in `src/components/` (or `src/routes/<feature>/_components/` for route-specific)
2. shadcn/ui components go in `src/components/ui/` — add via `npx shadcn@latest add <name>`
3. Use `@/` imports, Lucide icons, Sonner for toasts

### Data Fetching

1. Create API function in `src/lib/api/` or `src/api/`
2. Wrap in TanStack Query hook in `src/lib/hooks/`
3. Query keys: `["domain", "operation", params]`
4. For polling: use `refetchInterval` function returning `3000` or `false`

### Error Handling

- `AuthenticationError` (401), `PermissionError` (403), `NetworkError` defined in `src/types/admin.ts`
- API client (`src/api/client.ts`) intercepts 401/403 automatically
- Mutations show toast notifications on success/error

## Code Quality

- **Imports:** Always use `@/` alias (maps to `src/`). Never relative paths.
- **TypeScript:** Strict mode. No `any` without explicit justification.
- **Exports:** Named exports only. Use `export type` for type-only exports.
- **Commits:** Conventional commits format: `<type>(<scope>): <description>`
- **Tests:** 95% coverage minimum. Use `render()` from `@/test/render` (includes providers). Mock factories: `mock<Entity>()`.
- **Naming:** PascalCase components, `use*` hooks, `is`/`has` booleans, `_` prefix for unused params.

## Testing

- **Unit:** Vitest + React Testing Library + jsdom. Tests in `tests/`. Config: `vitest.config.ts`.
- **E2E:** Playwright with Chromium. Tests in `e2e/`. API calls intercepted via `page.route()` with mock data.
- **CI:** Unit tests in `deploy.yml`, E2E in `e2e.yml`. Both run on pushes/PRs to `main`.

## Backend API

Base URL: `VITE_API_BASE_URL` env var (default `http://localhost:8000/api/v1`).

Auth: JWT Bearer tokens with automatic refresh on 401. Roles: admin, analyst, viewer.

Key endpoints: `/auth/*`, `/voters`, `/boundaries`, `/elections`, `/imports`, `/exports`, `/geocoding`, `/analysis`.

Long-running operations return 202 Accepted — poll for status.

API docs: `http://localhost:8000/docs` (Swagger/OpenAPI).

## Documentation

- [Setup Guide](docs/setup-guide.md) — local dev, Docker, deployment
- [Development Guide](docs/development-guide.md) — architecture, conventions, testing
- [Admin Guide](docs/admin-guide.md) — admin features documentation
- [User Guide](docs/user-guide.md) — end user documentation
- [Constitution](.specify/memory/constitution.md) — non-negotiable engineering principles
