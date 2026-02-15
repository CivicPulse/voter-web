# Admin Features Developer Guide

This guide explains the implementation details of the admin panel features, including architecture, patterns, and best practices.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Authentication & Authorization](#authentication--authorization)
- [Data Fetching Patterns](#data-fetching-patterns)
- [Error Handling](#error-handling)
- [Component Patterns](#component-patterns)
- [Testing](#testing)

## Architecture Overview

### Tech Stack

- **Routing**: TanStack Router (file-based)
- **Data Fetching**: TanStack Query with intelligent polling
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand for auth/role state
- **HTTP**: ky client with automatic JWT injection
- **UI**: shadcn/ui components (React 19, Tailwind CSS v4)
- **Notifications**: Sonner for toast messages

### File Structure

```
src/
├── routes/
│   ├── admin.tsx              # Layout with access control
│   └── admin/
│       ├── users/
│       │   ├── index.tsx      # User list page
│       │   └── create.tsx     # User creation page
│       ├── imports/
│       │   ├── index.tsx      # Import jobs list
│       │   └── _components/   # Dialogs, tables (not routes)
│       └── exports/
│           ├── index.tsx      # Export jobs list
│           └── _components/   # Dialogs, tables (not routes)
├── lib/
│   ├── api/
│   │   └── admin.ts           # Admin API client functions
│   ├── hooks/
│   │   ├── use-user-role.ts   # Role fetching & caching
│   │   ├── use-admin-users.ts # User management hooks
│   │   ├── use-import-jobs.ts # Import operations
│   │   └── use-export-jobs.ts # Export operations
│   ├── schemas/
│   │   └── user-form.ts       # Zod validation schemas
│   └── utils/
│       └── file-validation.ts # Client-side file validation
├── types/
│   └── admin.ts               # TypeScript types for admin features
└── components/
    ├── admin-nav-menu.tsx     # Admin navigation component
    ├── admin-error-boundary.tsx # Error boundary for admin pages
    └── permission-error.tsx   # Permission error display
```

## Authentication & Authorization

### Role-Based Access Control

Admin features use a three-tier role system:

- `admin`: Full access to all admin features
- `analyst`: Access to data operations (imports/exports) and user viewing
- `viewer`: No admin access (read-only data viewing)

### Implementation

**1. Role Fetching (`useUserRole` hook):**

```typescript
export function useUserRole() {
  const { accessToken, setUserRole, logout } = useAuthStore()

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const user = await getCurrentUser()
        setUserRole(user.role)  // Update Zustand store
        return user
      } catch (error) {
        setUserRole(null)
        if (error instanceof AuthenticationError) {
          logout()  // Clear tokens & redirect
          throw error
        }
        throw error
      }
    },
    staleTime: 5 * 60 * 1000,  // Cache for 5 minutes
    enabled: !!accessToken,
    retry: (failureCount, error) => {
      // Don't retry auth/permission errors
      if (error instanceof AuthenticationError || error instanceof PermissionError) {
        return false
      }
      return failureCount < 1
    },
  })
}
```

**2. Layout-Level Access Control (`src/routes/admin.tsx`):**

```typescript
function AdminLayout() {
  const { data: user, isLoading, error } = useUserRole()

  // Handle errors first (401/403)
  if (error) {
    if (error instanceof AuthenticationError || error instanceof PermissionError) {
      return <PermissionErrorComponent error={error} />
    }
    // Generic error fallback
  }

  // Check role authorization
  const isAdmin = user?.role === "admin" || user?.role === "analyst"

  if (!user || !isAdmin) {
    return <AccessDeniedUI />
  }

  return (
    <div className="container mx-auto p-6">
      <Outlet />  {/* Render child routes */}
    </div>
  )
}
```

**3. Navigation Rendering (`src/routes/__root.tsx`):**

```typescript
const { data: userProfile } = useUserRole()
const isAdmin = userProfile?.role === "admin" || userProfile?.role === "analyst"

{isAdmin && <AdminNavMenu />}
```

## Data Fetching Patterns

### Auto-Polling with TanStack Query

Import and export job lists use intelligent polling that automatically starts/stops based on job states.

**Pattern:**

```typescript
export function useImportJobs() {
  return useQuery({
    queryKey: ["admin", "imports", "list"],
    queryFn: getImportJobs,
    refetchInterval: (query) => {
      const jobs = query.state.data?.jobs ?? []
      const hasActiveJobs = jobs.some(isActiveJob)
      return hasActiveJobs ? 3000 : false  // Poll every 3s or stop
    },
    staleTime: 0,  // Always refetch when polling is active
    retry: (failureCount, error) => {
      // Custom error handling (see Error Handling section)
    },
  })
}
```

**Key Points:**
- `refetchInterval` uses a function instead of a static value
- Function receives `query` object with current state
- Returns `false` to stop polling when all jobs are terminal
- `staleTime: 0` ensures fresh data while polling

**Helper Functions:**

```typescript
export function isActiveJob(job: ImportJob | ExportJob): boolean {
  return job.status === "pending" || job.status === "processing"
}

export function isTerminalJob(job: ImportJob | ExportJob): boolean {
  return job.status === "completed" || job.status === "failed"
}
```

### Mutation Patterns

All mutations follow a consistent pattern:

```typescript
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserRequest) => createUser(data),
    onSuccess: () => {
      // 1. Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      // 2. Show success toast
      toast.success("User created", {
        description: "The user account has been created successfully.",
      })
    },
    onError: (error: Error) => {
      // Handle specific error types
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else {
        toast.error("Failed to create user", {
          description: error.message || "An error occurred.",
        })
      }
    },
  })
}
```

## Error Handling

### Custom Error Classes

Three error types handle different failure scenarios:

```typescript
export class AuthenticationError extends Error {
  constructor(message = "Your session has expired. Please log in again.") {
    super(message)
    this.name = "AuthenticationError"
  }
}

export class PermissionError extends Error {
  constructor(message = "You don't have permission to access this feature.") {
    super(message)
    this.name = "PermissionError"
  }
}

export class NetworkError extends Error {
  constructor(message = "Network connection failed. Retrying...") {
    super(message)
    this.name = "NetworkError"
  }
}
```

### API Client Error Interception

The API client automatically catches and transforms HTTP error responses:

```typescript
// src/api/client.ts
export const api = ky.create({
  prefixUrl: API_BASE_URL,
  hooks: {
    afterResponse: [
      async (request, _options, response) => {
        // Handle 401 - Try token refresh, then throw AuthenticationError
        if (response.status === 401) {
          // Token refresh logic...
          throw new AuthenticationError()
        }

        // Handle 403 - Throw PermissionError
        if (response.status === 403) {
          throw new PermissionError()
        }

        return response
      },
    ],
  },
})
```

### Error Handling in Hooks

Hooks use TanStack Query's `retry` function for intelligent error handling:

```typescript
retry: (failureCount, error) => {
  // Never retry auth/permission errors
  if (error instanceof AuthenticationError || error instanceof PermissionError) {
    toast.error(/* ... */)
    return false  // Stop retrying
  }

  // Network errors: show warning, allow retry
  if (error instanceof NetworkError) {
    if (failureCount === 0) {
      toast.warning("Connection issue", {
        description: "Having trouble connecting. Will keep trying...",
      })
    }
    return failureCount < 2  // Retry up to 2 times
  }

  // Generic errors: allow limited retries
  return failureCount < 1
}
```

### Error Boundaries

All admin pages are wrapped in `AdminErrorBoundary`:

```typescript
export const Route = createFileRoute("/admin/users/")({
  component: () => (
    <AdminErrorBoundary>
      <UserManagementPage />
    </AdminErrorBoundary>
  ),
})
```

The error boundary catches runtime errors and displays appropriate UI:
- `AuthenticationError`/`PermissionError`: Show `PermissionErrorComponent`
- Other errors: Show generic error with reload button

## Component Patterns

### Two-Step Confirmation Dialogs

Critical operations use a two-step confirmation pattern to prevent accidental actions.

**Example: User Creation with Role Confirmation**

```typescript
const [pendingData, setPendingData] = useState<CreateUserFormValues | null>(null)
const [showConfirmDialog, setShowConfirmDialog] = useState(false)

const handleFormSubmit = (data: CreateUserFormValues) => {
  // Elevated roles require confirmation
  if (data.role === "admin" || data.role === "analyst") {
    setPendingData(data)
    setShowConfirmDialog(true)
  } else {
    // Viewer role: direct submission
    submitUser(data)
  }
}

const handleConfirm = () => {
  if (pendingData) {
    submitUser(pendingData)
    setShowConfirmDialog(false)
    setPendingData(null)
  }
}
```

### File Validation Pattern

File uploads validate client-side before showing confirmation:

```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Client-side validation
  const validationResult = importType === "voters"
    ? validateVoterFile(file)
    : validateBoundaryFile(file)

  if (validationResult !== true) {
    setValidationError(validationResult.message)
    return
  }

  // Show confirmation dialog
  setSelectedFile(file)
  setShowConfirm(true)
}
```

**Validation Utilities (`src/lib/utils/file-validation.ts`):**

```typescript
export const MAX_FILE_SIZE = 100 * 1024 * 1024  // 100MB
export const VOTER_FILE_TYPES = ["text/csv", "application/csv", ".csv"]
export const BOUNDARY_FILE_TYPES = [
  "application/geo+json",
  "application/json",
  ".geojson",
  ".json",
  "application/zip",
  "application/x-zip-compressed",
  ".zip",
]

export function validateVoterFile(file: File): FileValidationResult {
  if (!validateFileSize(file)) {
    return { type: "size", message: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}` }
  }
  if (!validateFileType(file, VOTER_FILE_TYPES)) {
    return { type: "type", message: "File must be in CSV format" }
  }
  return true
}
```

### Loading Skeletons

All list pages use skeleton loaders instead of spinners for better perceived performance:

```typescript
if (isLoading) {
  return (
    <div className="space-y-6">
      {/* Header skeletons */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Table row skeletons */}
      <div className="border rounded-lg p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-48" />
              {/* ... more columns */}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

## Testing

### Test Coverage Requirements

Per the project constitution (Principle III), all code must achieve 95% test coverage. The test infrastructure uses Vitest + React Testing Library.

**Run Tests:**
```bash
npm test              # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

**Coverage Thresholds (`vitest.config.ts`):**
```typescript
coverage: {
  provider: 'v8',
  thresholds: {
    lines: 95,
    functions: 95,
    branches: 95,
    statements: 95,
  },
}
```

### Testing Patterns

**Hook Testing:**
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

test('useUserRole fetches and caches user role', async () => {
  const queryClient = new QueryClient()
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  const { result } = renderHook(() => useUserRole(), { wrapper })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data?.role).toBe('admin')
})
```

**Component Testing:**
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('PermissionErrorComponent displays login button for auth errors', () => {
  const error = new AuthenticationError()
  render(<PermissionErrorComponent error={error} />)

  expect(screen.getByText(/session expired/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
})
```

### Manual Testing Checklist

Before deploying admin features, verify:

- [ ] Admin navigation appears only for admin/analyst users
- [ ] Admin routes redirect non-admin users to access denied
- [ ] User creation form validates inputs (username, email, password)
- [ ] Elevated role creation shows confirmation dialog
- [ ] Import file upload validates file type and size
- [ ] Import/export job lists auto-poll while jobs are active
- [ ] Polling stops when all jobs reach terminal states
- [ ] Download button appears only for completed export jobs
- [ ] Session expiration shows toast and redirects to login
- [ ] Permission errors show toast and hide admin UI
- [ ] Network errors during polling show warning (non-blocking)
- [ ] All forms have proper labels and keyboard navigation
- [ ] Error boundaries catch and display runtime errors

## Common Tasks

### Adding a New Admin Feature

1. **Create route file:** `src/routes/admin/new-feature/index.tsx`
2. **Define types:** Add interfaces to `src/types/admin.ts`
3. **Create API functions:** Add to `src/lib/api/admin.ts`
4. **Create hooks:** Add to `src/lib/hooks/use-new-feature.ts`
5. **Update navigation:** Add link to `src/components/admin-nav-menu.tsx`
6. **Wrap in error boundary:** Use `AdminErrorBoundary` in route component
7. **Add tests:** Create `__tests__/new-feature.test.ts` (95% coverage)

### Debugging Auto-Polling

If polling doesn't start/stop as expected:

1. Check `refetchInterval` function logic
2. Verify `isActiveJob()` correctly identifies active states
3. Ensure `staleTime: 0` for real-time updates
4. Check React DevTools → TanStack Query for query state
5. Add logging: `console.log('hasActiveJobs:', hasActiveJobs)`

### Handling New Error Types

To add a new error class:

1. Define in `src/types/admin.ts`:
   ```typescript
   export class ValidationError extends Error {
     constructor(message: string) {
       super(message)
       this.name = "ValidationError"
     }
   }
   ```

2. Update API client to throw it (`src/api/client.ts`)
3. Add handling in hooks' `retry` function
4. Add toast notification in `onError` handlers
5. Update error boundary if needed

## Performance Considerations

- **Query Caching**: User role cached for 5 minutes, user list for 30 seconds
- **Polling Efficiency**: Only polls when jobs are active (avoids unnecessary requests)
- **Skeleton Loaders**: Improve perceived performance during initial loads
- **Lazy Loading**: Admin routes code-split automatically by TanStack Router
- **Network Resilience**: Failed polls don't block UI, auto-retry with backoff

## Security Notes

- **Client-side validation is not security**: Always validate on server
- **Role enforcement on API**: Frontend checks are UX only, server must enforce
- **Token storage**: Uses localStorage (acceptable for SPA, consider security implications)
- **File uploads**: 100MB client limit, server should enforce stricter limits
- **No sensitive data logging**: Passwords, tokens never logged to console
