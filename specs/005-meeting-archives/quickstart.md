# Quickstart: Meeting Archives Browser

**Feature Branch**: `005-meeting-archives` | **Date**: 2026-02-20

## Prerequisites

- Node.js LTS (use `nvm use` — reads `.nvmrc`)
- voter-web project cloned and dependencies installed (`npm install`)
- `.env` configured with `VITE_API_BASE_URL` (defaults to `http://localhost:8000/api/v1`)

## Getting Started

### 1. Switch to Feature Branch

```bash
git checkout 005-meeting-archives
```

### 2. Install New Dependencies

```bash
# Add shadcn/ui breadcrumb component
npx shadcn@latest add breadcrumb

# Add DOMPurify for safe HTML rendering of search highlights
npm install dompurify @types/dompurify
```

### 3. Start Development Server

```bash
npm run dev
```

The Vite dev server will auto-generate routes from `src/routes/` via the TanStack Router plugin.

### 4. Regenerate Route Tree (if needed)

If the dev server isn't running and you need to regenerate routes:

```bash
npx @tanstack/router-cli generate --target react
```

## Project Structure

### New Files to Create

```
src/
├── types/
│   └── meetings.ts                          # TypeScript types for all meeting entities
├── lib/
│   ├── api/
│   │   └── meetings.ts                      # API client functions (ky wrappers)
│   ├── hooks/
│   │   └── use-meetings.ts                  # TanStack Query hooks
│   └── meetings-utils.ts                    # Video embed helpers, label maps, sanitizer
├── routes/
│   └── meetings/
│       ├── index.tsx                         # Landing page (search + directory)
│       ├── bodies/
│       │   ├── index.tsx                     # Governing bodies directory
│       │   ├── $bodySlug/
│       │   │   ├── index.tsx                 # Body detail + meeting list
│       │   │   └── $date/
│       │   │       └── $seq.tsx              # Meeting detail page
│       │   └── _components/
│       │       ├── bodies-filter-bar.tsx     # Body type + jurisdiction filters
│       │       └── body-card.tsx             # Governing body list card
│       ├── all/
│       │   └── index.tsx                     # All meetings cross-body list
│       ├── search/
│       │   ├── index.tsx                     # Search results page
│       │   └── _components/
│       │       ├── search-filters.tsx        # Faceted search filters
│       │       └── search-result-card.tsx    # Individual search result
│       └── _components/
│           ├── meeting-card.tsx              # Meeting list item card
│           ├── meeting-breadcrumb.tsx        # Breadcrumb navigation
│           ├── agenda-item-list.tsx          # Expandable agenda items
│           ├── agenda-item.tsx               # Single agenda item (collapsible)
│           ├── video-embed.tsx               # YouTube/Vimeo iframe embed
│           ├── attachment-list.tsx           # File attachment list
│           ├── pdf-preview-dialog.tsx        # Inline PDF viewer dialog
│           └── meeting-search-bar.tsx        # Search input component
```

### Existing Files to Modify

```
src/routes/__root.tsx          # Add "Meetings" nav item
```

## API Endpoints (Contracts)

All endpoints are under `/api/v1/` and require no authentication.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/governing-bodies` | List bodies (filtered, paginated) |
| `GET` | `/governing-bodies/{slug}` | Body detail |
| `GET` | `/governing-bodies/states` | Available states for filter |
| `GET` | `/governing-bodies/counties?state=GA` | Counties for state filter |
| `GET` | `/governing-bodies/{slug}/meetings` | Body's meeting list |
| `GET` | `/governing-bodies/{slug}/meetings/{date}/{seq}` | Meeting detail |
| `GET` | `/meetings` | All meetings cross-body |
| `GET` | `/meetings/search?q=...` | Full-text search |

See `contracts/openapi.yaml` for full specification.

## Key Patterns

### Adding a Route

Create a file under `src/routes/meetings/`. Export `Route` using `createFileRoute()`:

```typescript
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/meetings/bodies/")({
  component: GoverningBodiesPage,
})

function GoverningBodiesPage() {
  // ...
}
```

### URL Search Params (Filters)

Use Zod schema for type-safe URL query params:

```typescript
import { z } from "zod"

const searchSchema = z.object({
  body_type: z.string().optional(),
  state: z.string().optional(),
  county: z.string().optional(),
  page: z.number().optional().default(1),
})

export const Route = createFileRoute("/meetings/bodies/")({
  validateSearch: searchSchema,
  component: GoverningBodiesPage,
})
```

### API Client Function

Follow existing pattern in `src/lib/api/`:

```typescript
import { api } from "@/api/client"
import type { PaginatedGoverningBodyListResponse } from "@/types/meetings"

export async function getGoverningBodies(
  params?: GoverningBodyFilters,
): Promise<PaginatedGoverningBodyListResponse> {
  const searchParams: Record<string, string> = {}
  // Build params conditionally...
  const raw = await api.get("governing-bodies", { searchParams }).json<RawResponse>()
  return { bodies: raw.items, ...raw.pagination }
}
```

### TanStack Query Hook

```typescript
import { useQuery } from "@tanstack/react-query"

export function useGoverningBodies(filters?: GoverningBodyFilters, page = 1) {
  return useQuery({
    queryKey: ["governing-bodies", "list", filters, page],
    queryFn: () => getGoverningBodies({ ...filters, page }),
    staleTime: 60_000,  // Bodies list doesn't change frequently
  })
}
```

## Testing

### Unit Tests

Place in `tests/` mirroring `src/` structure:
- `tests/types/meetings.test.ts` — type utility tests
- `tests/lib/meetings-utils.test.ts` — helper function tests
- `tests/lib/hooks/use-meetings.test.ts` — hook tests with mocked API

### E2E Tests

Place in `e2e/`:
- `e2e/meetings.spec.ts` — end-to-end flow tests

Add mock data to `e2e/fixtures/mock-data.ts` and route interception to a new `e2e/fixtures/meetings-api.ts`.

## Development Without Backend

Since the backend API doesn't exist yet, development uses two approaches:

1. **Dev server**: Create a mock API handler or use MSW (Mock Service Worker) to intercept requests
2. **E2E tests**: Use Playwright's `page.route()` to intercept API calls with mock JSON responses (existing project pattern)

The mock data structure should match `contracts/openapi.yaml` exactly.
