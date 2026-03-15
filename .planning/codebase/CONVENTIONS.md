# Coding Conventions

**Analysis Date:** 2026-03-13

## Naming Patterns

**Files:**
- Component files: PascalCase (e.g., `ElectionTable.tsx`, `RaceListItem.tsx`)
- Hook files: `use` prefix + camelCase (e.g., `useVoters.ts`, `useBoundaries.ts`)
- API modules: camelCase (e.g., `voters.ts`, `elections.ts`, `rate-limited-fetch.ts`)
- Store modules: camelCase with store suffix (e.g., `authStore.ts`, `navigation-context.ts`)
- Type modules: camelCase (e.g., `voter.ts`, `elections.ts`, `admin.ts`)
- Utility modules: camelCase (e.g., `utils.ts`, `slugs.ts`)
- Test files: mirror source structure with `.test.ts` or `.test.tsx` suffix (e.g., `tests/api/voters.test.ts`)

**Functions:**
- Regular functions: camelCase (e.g., `searchVoters()`, `getVoterDetail()`, `stripCountySuffix()`)
- React components: PascalCase (e.g., `ElectionTable`, `RedirectToElectionDetail`)
- Custom hooks: `use` prefix + camelCase (e.g., `useVoterSearch()`, `useNavigationContext()`)
- Factory functions (test data): `mock` prefix + camelCase (e.g., `mockVoterSearchResponse()`, `mockElection()`)
- Internal helper functions: camelCase with descriptive verbs (e.g., `toRawSearchResponse()`, `makeElection()`)

**Variables:**
- Local state: camelCase (e.g., `stateAbbrev`, `countyName`)
- Query keys: arrays of strings starting broad to specific (e.g., `["voters", "search", params]`, `["voters", voterId]`)
- Boolean flags: prefix with `is` or `has` (e.g., `isAdmin`, `hasPointerCapture`, `hasActiveJobs`)
- Unused parameters: prefix with underscore (e.g., `_options`, enforced by ESLint rule)

**Types:**
- Interfaces: PascalCase, descriptive naming (e.g., `VoterSearchResponse`, `NavigationContextState`)
- Type aliases: PascalCase (e.g., `UserRole`, `JobStatus`)
- Enums: PascalCase values (e.g., `election_type: "special"` → stored as is from API)
- Generic type parameters: single uppercase letter for simple cases, descriptive PascalCase for complex (e.g., `<T>`, `<Result>`, `<Props>`)
- Internal/raw types from backend: `Raw` prefix (e.g., `RawVoterDetail`, `RawVoterSearchResponse`)

## Code Style

**Formatting:**
- Uses Prettier (configured via ESLint flat config in `eslint.config.js`)
- Line length: default (typically 80-100 chars)
- Quotes: double quotes (enforced by Prettier)
- Semicolons: always (enforced by Prettier)
- Trailing commas: ES5 compatible

**Linting:**
- Tool: ESLint 9+ with flat config (`eslint.config.js`)
- TypeScript support: `typescript-eslint` for strict type checking
- React rules: `react-hooks` (enforces hook dependency arrays)
- React refresh: `react-refresh` for Vite HMR compatibility
- Unused variables: flagged as error unless prefixed with `_` (ESLint rule: `@typescript-eslint/no-unused-vars`)
- Exclusions: `src/routeTree.gen.ts` (auto-generated), test files, dist, coverage
- Special rules for UI components: `react-refresh/only-export-components` disabled in `src/components/ui/**/*` and test files

**TypeScript:**
- Strict mode: enabled globally in `tsconfig.json` with `"strict": true`
- Case sensitivity enforced: `"forceConsistentCasingInFileNames": true`
- Path alias: `@/*` maps to `./src/*` in all configs (tsconfig, Vite, Vitest)
- Version: TypeScript 5.9+

## Import Organization

**Order:**
1. React and external libraries (e.g., `react`, `zustand`, `ky`)
2. TanStack libraries (Router, Query, Table)
3. UI framework libraries (shadcn/ui, Lucide)
4. Utility libraries (Zod, clsx)
5. Internal absolute imports using `@/` alias (`@/components`, `@/hooks`, `@/api`, `@/stores`, `@/types`, `@/lib`)
6. Internal relative imports (rare; prefer `@/`)

**Path Aliases:**
- `@/` → `src/` directory (only alias in use)
- Enforced across TypeScript config, Vite, and Vitest
- Never use relative paths like `../../../` or `./` when `@/` is available

**Example:**
```typescript
import { createFileRoute, Navigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { VoterSearchResponse } from "@/types/voter"
```

## Error Handling

**Patterns:**

- **Custom Error Classes:** Typed errors for specific failure modes (in `src/types/admin.ts`):
  - `AuthenticationError` (401) — Session expired
  - `PermissionError` (403) — Insufficient permissions
  - `NetworkError` — Network failures during polling
  - Constructor accepts optional custom message, sets `this.name` property

- **API Client Error Interception:** `src/api/client.ts` intercepts 401/403 responses:
  - 401: Triggers token refresh, retries request, redirects to `/login` on final failure
  - 403: Throws `PermissionError` immediately
  - Throws `AuthenticationError` with default message on auth failure
  - Dynamic import of Zustand store used to avoid circular dependencies

- **Toast Notifications:** Admin operations show Sonner toasts on error:
  - Success toasts on mutations (user creation, file upload, export)
  - Error toasts with user-friendly messages
  - Network errors during polling: show warning once, continue with last known data

- **Try-Catch Patterns:** Mutations catch errors and re-throw or handle gracefully:
  ```typescript
  try {
    await refreshPromise
  } catch (error) {
    throw error instanceof AuthenticationError
      ? error
      : new AuthenticationError()
  }
  ```

- **Hooks Pattern:** Admin hooks use error boundary integration:
  - `useAdminUsers()`, `useImportJobs()`, `useExportJobs()` all handle errors
  - Errors automatically invalidate queries on failure
  - Role changes reactively hide admin UI

## Logging

**Framework:** No structured logging library; uses `console` methods

**Patterns:**
- Development: console statements allowed (no restrictions)
- Comments document non-obvious logic (e.g., `// Dynamic import to avoid circular dependency`)
- Network retry logic documented with inline comments
- No production logging/telemetry configured

## Comments

**When to Comment:**
- Non-obvious logic: why something is done, not what (code shows the what)
- Workarounds: mark with clear explanation
- Complex calculations or algorithms: explain the approach
- Cross-cutting concerns: when state is shared globally or affects multiple modules

**JSDoc/TSDoc:**
- Used for module-level documentation (e.g., `@module types/admin`)
- Used for custom error classes and public API functions
- Type definitions include inline comments for clarity
- Parameters and return types documented in function declarations

**Examples from codebase:**
```typescript
/**
 * Custom render function that wraps components with test providers.
 * Use this instead of @testing-library/react render for components
 * that use TanStack Query hooks.
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: TestProviders, ...options })
}
```

```typescript
// Ensure we're not retrying auth endpoints to prevent infinite loops
if (
  request.url.includes("/auth/login") ||
  request.url.includes("/auth/refresh")
) {
  return response
}
```

## Function Design

**Size:** Functions are typically small, single-purpose:
- API functions: focus on one endpoint or operation (e.g., `searchVoters()`, `getVoterDetail()`)
- Components: break into `_components/` subdirectories if complex
- Hooks: wrap a single data operation (search, fetch, mutation)

**Parameters:**
- API functions accept typed parameter objects: `searchVoters(params: VoterSearchParams)`
- Components receive props as typed interfaces
- Hooks accept minimal parameters (query keys, IDs)
- Use destructuring for readability

**Return Values:**
- API functions return typed Promise (e.g., `Promise<VoterSearchResponse>`)
- Hooks return TanStack Query objects (useQuery, useMutation)
- Component prop functions typed with arrow function types

**Example:**
```typescript
export function useVoterSearch(params: VoterSearchParams) {
  return useQuery({
    queryKey: ["voters", "search", params],
    queryFn: () => searchVoters(params),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  })
}
```

## Module Design

**Exports:**
- Named exports for all functions/types (no default exports)
- Type exports use `export type` for clarity
- Barrel exports in `index.ts` files only when grouping related functionality

**Barrel Files:**
- Used in `src/components/ui/` for shadcn components
- Used in `src/test/` for render utilities and mocks
- Not used in feature directories (import directly from source)

**Example (test barrel):**
```typescript
// src/test/render.tsx exports:
export { customRender as render, customRenderHook as renderHook, createTestQueryClient, createWrapper }
```

## TypeScript Strictness

- All TypeScript files written in strict mode
- No `any` types without explicit comment explaining why
- Types for API responses include both raw backend shape and transformed frontend shape
- Discriminated unions used for state variants (e.g., `JobStatus`)
- Path aliases avoid circular dependencies through dynamic imports

---

*Convention analysis: 2026-03-13*
