# Testing Patterns

**Analysis Date:** 2026-03-13

## Test Framework

**Runner:**
- Vitest 4.0.18
- Config: `vitest.config.ts`
- Environment: jsdom (browser-like DOM for component testing)
- Globals: true (no need to import `describe`, `it`, `expect`)

**Assertion Library:**
- Vitest built-in + @testing-library/jest-dom matchers (loaded in setup)

**Run Commands:**
```bash
npm test              # Run all tests in watch mode
npm test -- --run     # Run once (CI mode)
npm test:ui           # Start Vitest UI dashboard
npm test:coverage     # Run with coverage report (v8 provider)
```

## Test File Organization

**Location:**
- Co-located: Test files mirror `src/` structure in `tests/` directory
- Pattern: `tests/[path]/[filename].test.ts` mirrors `src/[path]/[filename].ts`
- Example: `src/api/voters.ts` → `tests/api/voters.test.ts`

**Naming:**
- Test files: `*.test.ts` or `*.test.tsx` suffix
- Describe blocks: human-readable function/component name
- Test cases: "should X" or "returns Y when Z"

**Structure:**
```
tests/
├── api/                    # API function tests
│   ├── voters.test.ts
│   ├── elections.test.ts
│   ├── auth.test.ts
│   └── rate-limited-fetch.test.ts
├── routes/                 # Page/route component tests
│   ├── elections/
│   │   ├── $electionDate.test.tsx
│   │   └── $electionDate/$electionId.test.tsx
│   ├── admin/
│   │   ├── elections/
│   │   │   └── _components/
│   │   │       ├── election-table.test.tsx
│   │   │       └── delete-election-dialog.test.tsx
│   │   └── users/
│   └── voters/
│       └── voters-layout.test.tsx
└── resolveHeaderTitle.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { searchVoters } from "@/api/voters"
import { mockVoterSearchResponse } from "@/test/mocks/voters"
import type { VoterSearchResponse } from "@/types/voter"

// Mock external dependencies at top level
vi.mock("@/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// Setup per-test
beforeEach(() => {
  vi.clearAllMocks()
})

// Test suites by function
describe("searchVoters", () => {
  it("calls GET /voters with search params and transforms response", async () => {
    // Arrange: set up mocks and test data
    const expected = mockVoterSearchResponse()
    mockJson.mockResolvedValue(toRawSearchResponse(expected))

    // Act: call the function
    const result = await searchVoters({ q: "Smith", page: 2 })

    // Assert: verify behavior
    expect(mockGet).toHaveBeenCalledWith("voters", {
      searchParams: { q: "Smith", page: "2" },
    })
    expect(result).toEqual(expected)
  })

  it("omits undefined params from search params", async () => {
    // Test edge case
  })
})

describe("getVoterDetail", () => {
  it("calls GET /voters/{voterId} and transforms backend response", async () => {
    // Separate describe block for different function
  })
})
```

**Patterns:**
- Arrange-Act-Assert (AAA) structure within tests
- Mock setup at module level using `vi.mock()` with path aliases
- Factory functions for mock data (e.g., `mockVoterSearchResponse()`)
- Clear test names describing behavior not implementation

## Component Testing

**Test Wrapper:**
```typescript
import { render } from "@/test/render"

// Custom render wraps components with QueryClientProvider + TooltipProvider
const { getByText } = render(
  <ElectionTable elections={[makeElection()]} isAdmin={false} />
)

// For hooks that use TanStack Query:
import { renderHook } from "@/test/render"

const { result } = renderHook(() => useVoterSearch({ q: "Smith" }))
```

**Mock Pattern for Components:**
```typescript
// Mock Router/Navigation
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <a {...props}>{children}</a>
  ),
}))

// Mock child components to isolate unit under test
vi.mock("@/routes/admin/elections/_components/delete-election-dialog", () => ({
  DeleteElectionDialog: () => null,
}))
```

**Factory for Test Data:**
```typescript
function makeElection(overrides?: Partial<Election>): Election {
  return {
    id: "election-1",
    name: "Test Election",
    election_date: "2026-03-01",
    election_type: "special",
    district: "Test District",
    status: "active",
    last_refreshed_at: null,
    ...overrides,
  }
}

// Use in tests:
render(<ElectionTable elections={[makeElection({ status: "inactive" })]} />)
```

## Mocking

**Framework:** Vitest `vi` mock utilities

**Patterns:**

**API Mocking (`src/api/client.ts`):**
```typescript
const mockJson = vi.fn()
const mockGet = vi.fn(() => ({ json: mockJson }))
const mockPost = vi.fn(() => Promise.resolve())
const mockPut = vi.fn(() => ({ json: mockJson }))
const mockDelete = vi.fn(() => Promise.resolve())

vi.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}))

// In test:
mockJson.mockResolvedValue({ items: [...], pagination: {...} })
const result = await searchVoters({})
expect(mockGet).toHaveBeenCalledWith("voters", { searchParams: {} })
```

**Hook Mocking:**
```typescript
vi.mock("@/lib/hooks/use-admin-elections", () => ({
  useDeleteElection: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}))
```

**Browser API Mocking (setup.ts):**
```typescript
// matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    // ... other required properties
  })),
})

// Pointer events for Radix UI / vaul
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()
Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false)

// IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  // ... other required methods
} as unknown as typeof IntersectionObserver
```

**What to Mock:**
- External API clients (ky HTTP calls)
- Router navigation
- Child components in isolation tests
- Browser APIs (matchMedia, IntersectionObserver, pointer events)

**What NOT to Mock:**
- TanStack Query internals (use custom test client with retries disabled)
- Zod validators (test validation logic)
- Utility functions (test real implementations)

## Fixtures and Factories

**Test Data Factories:**
- Location: `src/test/mocks/` (mirrors test data by domain)
- Pattern: `mock[Type](overrides?: Partial<Type>): Type`
- Returns realistic default data with optional field overrides
- Used across all test files for consistency

**Examples from `src/test/mocks/elections.ts`:**
```typescript
export function mockVoteMethodResult(
  overrides?: Partial<VoteMethodResult>,
): VoteMethodResult {
  return {
    group_name: "Election Day",
    vote_count: 5000,
    ...overrides,
  }
}

export function mockCandidateResult(
  overrides?: Partial<CandidateResult>,
): CandidateResult {
  return {
    id: "cand-001",
    name: "Jane Doe",
    political_party: "Dem",
    ballot_order: 1,
    vote_count: 12500,
    group_results: [
      mockVoteMethodResult({ group_name: "Election Day", vote_count: 8000 }),
      // ...
    ],
    ...overrides,
  }
}

export function mockElection(overrides?: Partial<Election>): Election {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "State Senate District 18 Special",
    election_date: "2026-02-17",
    // ... realistic defaults
    ...overrides,
  }
}
```

**Voter Mocks (from tests):**
```typescript
function toRawSearchResponse(response: VoterSearchResponse) {
  return {
    items: response.voters.map((v) => ({
      id: v.id,
      voter_registration_number: v.voter_id,
      first_name: v.first_name,
      // ... transform frontend shape to backend shape
    })),
    pages: response.total_pages,
    total: response.total,
    page: response.page,
    page_size: response.page_size,
  }
}
```

## Setup & Providers

**Setup File:** `src/test/setup.ts`
- Imports `@testing-library/jest-dom` for extended matchers
- Configures `afterEach` cleanup with React Testing Library
- Mocks browser APIs (matchMedia, pointer events, IntersectionObserver, getComputedStyle)
- Global configuration loaded by Vitest before each test

**Custom Render Wrapper:** `src/test/render.tsx`
```typescript
function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}

export function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: TestProviders, ...options })
}

// Use instead of direct React Testing Library render
// Exports also aliased: render, renderHook
```

**Query Client for Tests:**
```typescript
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },      // Disable retries in tests
      mutations: { retry: false },
    },
  })
}
```

## Coverage

**Requirements:** 95% thresholds on all metrics (lines, functions, branches, statements)

**View Coverage:**
```bash
npm run test:coverage
# Generates HTML report in coverage/ directory
```

**Exclusions from Coverage:**
- `node_modules/`
- `dist/`
- `src/routeTree.gen.ts` (auto-generated by TanStack Router)
- `src/test/` (test infrastructure itself)
- `src/components/ui/` (shadcn components, pre-built)
- `**/*.d.ts` (type definitions)
- `**/*.config.*` (configuration files)
- `**/mockData` (test fixtures)

## Test Types

**Unit Tests:**
- Scope: Single function or hook in isolation
- Location: `tests/api/`, `tests/hooks/`, component tests
- Approach: Mock all external dependencies, test business logic and transformations
- Example: `searchVoters()` transforms raw API response to frontend shape

**Integration Tests:**
- Scope: Multiple components or API calls working together
- Location: Route/page component tests
- Approach: Use real QueryClient (in test providers), mock API responses
- Example: `ElectionTable` rendering a list of elections with delete buttons

**E2E Tests:**
- Scope: Full user flows in browser
- Framework: Playwright (separate from Vitest)
- Config: `playwright.config.ts`
- Run: `npm run test:e2e` or `npm run test:e2e:ui`
- Approach: Mock API responses at network level, test rendered UI
- Details: See E2E section below

## E2E Testing (Playwright)

**Framework:** Playwright with Chromium browser

**Config:** `playwright.config.ts`
- Test directory: `e2e/`
- Base URL: `http://localhost:4173` (production build via `vite preview`)
- Auto-starts preview server before tests
- Traces and screenshots on failure
- CI: 2 retries, 1 worker; Dev: parallel workers

**Mock Data Setup:** `e2e/fixtures/mock-data.ts`
- Self-contained (no `@/` imports) for Playwright compatibility
- Mirrors factory output from `src/test/mocks/`
- Named exports: `ELECTION_ID`, `ELECTION_DATE`, response shapes

**API Mocking:** `e2e/fixtures/election-api.ts`
- Custom Playwright test fixture extending `test`
- `setupElectionApiMocks(page, options)` function intercepts `page.route()`
- Routes API calls to mock JSON responses
- Example:
  ```typescript
  export const test = base.extend({
    setupElectionApiMocks: setupElectionApiMocks,
  })
  ```

**E2E Test Structure:**
```typescript
import { test, expect, setupElectionApiMocks } from "./fixtures/election-api"
import { ELECTION_ID, electionDetailResponse } from "./fixtures/mock-data"

test.describe("Election Results Page", () => {
  test("displays race results when data is available", async ({ page }) => {
    // Mock API before navigation
    await setupElectionApiMocks(page, {
      resultsOverride: electionDetailResponse,
    })

    // Navigate to page
    await page.goto(`/elections/2026-02-17/${ELECTION_ID}?tab=results`)

    // Interact and verify rendered UI
    await expect(page.getByText("State Senate District 18 Special")).toBeVisible()
    await expect(page.getByText(/\d+% reporting/)).toHaveText("79% reporting")
  })
})
```

**When to Update E2E Tests:**
- After fixing UI bugs (add regression test that would have caught it)
- After adding/modifying user-facing features (especially interactive elements)
- After changing API response shapes or endpoint URLs
- After modifying map rendering, dropdown behavior, or data display
- After changing responsive layout or mobile behavior

**Common E2E Assertions:**
```typescript
// Visibility
await expect(page.getByText("text")).toBeVisible()
await expect(element).not.toBeVisible()

// Text content
await expect(element).toHaveText("exact text")
const text = await element.textContent()
expect(text).toContain("substring")

// User interactions
await page.goto(url)
await element.click()
await page.getByLabel("filter").selectOption("option-value")
await page.waitForTimeout(1000)  // Wait for animations/API
```

**Example Regression Test (from `e2e/election-results.spec.ts`):**
```typescript
test("displays derived percentage when top-level precinct counts are null", async ({
  page,
}) => {
  // Override the auto-applied mock with null precinct counts
  await setupElectionApiMocks(page, {
    resultsOverride: electionResultsWithNullCounts,
  })

  await page.goto(RACE_URL)

  const badge = page.getByText(/\d+% reporting/)
  await expect(badge).toBeVisible()

  // Must NOT show "NaN% reporting"
  const badgeText = await badge.textContent()
  expect(badgeText).not.toContain("NaN")

  // Falls back to county_results sum: 38/45 = 84%
  await expect(badge).toHaveText("84% reporting")
})
```

## CI Integration

**Unit Tests:**
- Command: `npm test -- --run`
- Triggered on: Push to main, PRs to main (via `.github/workflows/deploy.yml`)
- Runs after linting, before build

**E2E Tests:**
- Command: `npm run build && npm run test:e2e`
- Triggered on: Push to main, PRs to main (via `.github/workflows/e2e.yml`)
- Requires production build (`vite preview`)
- Produces HTML report and screenshots on failure

---

*Testing analysis: 2026-03-13*
