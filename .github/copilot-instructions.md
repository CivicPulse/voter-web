# Copilot Instructions

React 19 SPA with TypeScript 5.9 strict mode, Vite 7, Tailwind CSS v4, shadcn/ui (new-york style, neutral base).

## Import Patterns

```typescript
// Always use @/ alias (maps to src/). Never use relative paths.
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { VoterSearchResponse } from "@/types/voter"

// Import order: external → TanStack → UI → utilities → @/ internal
import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { z } from "zod"
import { useAuthStore } from "@/stores/authStore"
```

## Component Patterns

```typescript
// shadcn/ui components live in src/components/ui/
// Custom components in src/components/
// Route-specific components in src/routes/<feature>/_components/

// Class merging
import { cn } from "@/lib/utils"
<div className={cn("base-classes", conditional && "extra-classes")} />

// Icons from lucide-react
import { Search, Loader2, AlertCircle } from "lucide-react"

// Toast notifications
import { toast } from "sonner"
toast.success("Created", { description: "Details here" })
toast.error("Failed", { description: error.message })
```

## Route Files

```typescript
// Every route file must export Route
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

const searchSchema = z.object({
  page: z.number().optional().catch(undefined),
})

export const Route = createFileRoute("/path/")({
  component: PageComponent,
  validateSearch: searchSchema,
})

// _components/ directories are excluded from routing (underscore prefix)
// src/routeTree.gen.ts is auto-generated — never edit
```

## Data Fetching

```typescript
// TanStack Query hooks in src/lib/hooks/
// API functions in src/lib/api/ or src/api/
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// Query key pattern: ["domain", "operation", params]
useQuery({
  queryKey: ["elections", "list", filters],
  queryFn: () => getElections(filters),
  staleTime: 60_000,
})

// Auto-polling for active jobs
refetchInterval: (query) => {
  const hasActive = query.state.data?.jobs?.some(j => j.status === "pending" || j.status === "processing")
  return hasActive ? 3000 : false
}

// HTTP client: ky instances in src/api/client.ts
// `api` — authenticated (JWT), `publicApi` — optional auth
```

## State Management

```typescript
// Server state: TanStack Query (src/lib/hooks/)
// Auth state: Zustand (src/stores/authStore.ts)
// Geographic context: Zustand (src/stores/navigation-context.ts)
// UI state: React useState (component-local)
```

## Type Definitions

```typescript
// Types in src/types/
// Named exports, PascalCase, use `export type`
export type UserRole = "admin" | "analyst" | "viewer"
export interface VoterSearchResponse {
  voters: Voter[]
  total: number
}

// Raw API types use Raw prefix
interface RawVoterDetail { /* backend shape */ }
```

## Testing

```typescript
// Use custom render from @/test/render (includes providers)
import { render, renderHook } from "@/test/render"
import { screen, waitFor } from "@testing-library/react"

// Mock factories: mock<Entity>() in src/test/mocks/
import { mockElection } from "@/test/mocks/elections"

// Module mocking
vi.mock("@/api/client", () => ({ api: { get: vi.fn() } }))
```

## Naming Conventions

- **Components:** PascalCase — `ElectionTable`, `VoterSearchFilters`
- **Hooks:** `use` prefix — `useVoterSearch()`, `useElections()`
- **Booleans:** `is`/`has` prefix — `isAdmin`, `hasActiveJobs`, `isLoading`
- **Files:** PascalCase for components, camelCase for hooks/utils/types
- **Unused params:** `_` prefix — `_options`, `_event`
- **Query keys:** `["domain", "operation", params]`

## Key Files

- `src/api/client.ts` — ky HTTP client with JWT hooks
- `src/stores/authStore.ts` — auth state (tokens, login, logout)
- `src/lib/utils.ts` — `cn()` class merging utility
- `src/test/render.tsx` — custom test render with providers
- `src/routeTree.gen.ts` — auto-generated, read-only
- `vitest.config.ts` — test config, 95% coverage thresholds
