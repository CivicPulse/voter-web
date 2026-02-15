# Admin Feature TypeScript Types - Implementation Summary

**Created**: 2026-02-14
**Status**: Complete
**Files Created**: 2

## Overview

Comprehensive TypeScript type definitions have been created for the admin feature, providing production-ready types for user management, import jobs, export jobs, form schemas, and API contracts.

## Files Created

### 1. `/src/types/admin.ts` (548 lines)

Production-ready TypeScript type definitions with:

- **Job Status Types**: Discriminated unions for type-safe state management
- **User Management Types**: AdminUser, CreateUserRequest, UserListResponse
- **Import Job Types**: State-based discriminated union (pending/processing/completed/failed)
- **Export Job Types**: State-based discriminated union (pending/processing/completed/failed)
- **Permission Error Types**: PermissionError, AuthenticationError, ApiError
- **Form Schema Types**: UserFormValues, VoterImportFormValues, BoundaryImportFormValues
- **Utility Functions**: Type guards and helper functions
- **File Validation**: Constants and validation types

### 2. `/docs/admin-types-guide.md` (750+ lines)

Comprehensive documentation covering:

- Type system design principles
- Usage patterns and examples
- Best practices
- Integration with existing types
- Future extensibility

## Type System Highlights

### Discriminated Unions for Job States

Both import and export jobs use discriminated unions with `status` as the discriminant:

```typescript
type ImportJob =
  | ImportJobPending      // status: "pending"
  | ImportJobProcessing   // status: "processing"
  | ImportJobCompleted    // status: "completed"
  | ImportJobFailed       // status: "failed"
```

**Benefits**:
- TypeScript automatically narrows types in switch/if statements
- Compile-time safety for state-specific property access
- Prevents runtime errors from accessing undefined properties

### Strict Null Safety

All nullable fields explicitly typed with `| null`:

```typescript
interface ImportJobFailed {
  started_at: string | null       // May be null if failed before start
  error_message: string            // Always present
  total_records: number | null     // Partial progress metrics
}
```

### Type Guards and Utility Functions

Runtime type checking with TypeScript type narrowing:

```typescript
// Exported type guard functions
export function isActiveJob(job: ImportJob | ExportJob): boolean
export function isTerminalJob(job: ImportJob | ExportJob): boolean
export function isFailedImport(job: ImportJob): job is ImportJobFailed
export function isCompletedExport(job: ExportJob): job is ExportJobCompleted
export function getImportProgress(job: ImportJob): number | null
```

## Key Type Definitions

### User Management

```typescript
interface AdminUser {
  id: string
  username: string
  email: string
  role: UserRole  // "admin" | "analyst" | "viewer"
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

interface CreateUserRequest {
  username: string
  email: string
  password: string
  role: UserRole
  is_active?: boolean
}

interface UserListResponse {
  users: AdminUser[]
  total: number
}
```

### Import Jobs

```typescript
// Base properties shared across all states
interface ImportJobBase {
  id: string
  filename: string
  import_type: "voters" | "boundaries"
  created_at: string
}

// State-specific interfaces
interface ImportJobPending extends ImportJobBase {
  status: "pending"
  started_at: null
  completed_at: null
  error_message: null
  total_records: null
  processed_records: null
  failed_records: null
}

interface ImportJobProcessing extends ImportJobBase {
  status: "processing"
  started_at: string
  completed_at: null
  error_message: null
  total_records: number
  processed_records: number
  failed_records: number
}

interface ImportJobCompleted extends ImportJobBase {
  status: "completed"
  started_at: string
  completed_at: string
  error_message: null
  total_records: number
  processed_records: number
  failed_records: number
}

interface ImportJobFailed extends ImportJobBase {
  status: "failed"
  started_at: string | null
  completed_at: string
  error_message: string
  total_records: number | null
  processed_records: number | null
  failed_records: number | null
}
```

### Export Jobs

```typescript
// Similar discriminated union structure
type ExportJob =
  | ExportJobPending
  | ExportJobProcessing
  | ExportJobCompleted
  | ExportJobFailed

interface ExportJobCompleted extends ExportJobBase {
  status: "completed"
  started_at: string
  completed_at: string
  error_message: null
  download_url: string  // Signed URL for download
}
```

### API Request/Response Types

All endpoints have corresponding request/response types:

```typescript
// User management
CreateUserRequest → CreateUserResponse (AdminUser)
GET /users → UserListResponse { users: AdminUser[], total: number }

// Imports
CreateVoterImportRequest → CreateImportResponse (ImportJobPending)
CreateBoundaryImportRequest → CreateImportResponse (ImportJobPending)
GET /imports/{id} → GetImportResponse (ImportJob)
GET /imports → ImportListResponse { jobs: ImportJob[], total: number }

// Exports
CreateExportRequest → CreateExportResponse (ExportJobPending)
GET /exports/{id} → GetExportResponse (ExportJob)
GET /exports → ExportListResponse { jobs: ExportJob[], total: number }
```

### Form Schema Types

React Hook Form integration with UI-specific fields:

```typescript
interface UserFormValues {
  username: string
  email: string
  password: string
  confirmPassword: string  // UI-only field for validation
  role: UserRole
  is_active: boolean
}

interface VoterImportFormValues {
  file: File | null
}

interface BoundaryImportFormValues {
  file: File | null
  boundary_type: string
}

interface ExportFormValues {
  export_type: "voters" | "boundaries" | "full_database"
  filters?: Record<string, unknown>
}
```

### File Validation

Type-safe constants and validation types:

```typescript
// Constants
export const MAX_FILE_SIZE = 100 * 1024 * 1024  // 100MB
export const VOTER_FILE_TYPES = ["text/csv", "application/csv", ".csv"] as const
export const BOUNDARY_FILE_TYPES = [
  "application/geo+json",
  "application/json",
  ".geojson",
  ".json",
  "application/zip",
  "application/x-zip-compressed",
  ".zip",
] as const

// Validation result types
interface FileValidationError {
  type: "size" | "type" | "unknown"
  message: string
  maxSize?: number
  actualSize?: number
  allowedTypes?: readonly string[]
  actualType?: string
}

type FileValidationResult = true | FileValidationError
```

### Error Types

Comprehensive error handling types:

```typescript
interface PermissionError {
  error: "permission_denied" | "insufficient_role"
  message: string
  required_role?: UserRole
  current_role?: UserRole
}

interface AuthenticationError {
  error: "unauthorized" | "token_expired" | "invalid_token"
  message: string
}

interface ApiError {
  status: number
  error: string
  message: string
  details?: Record<string, unknown>
}
```

## Usage Examples

### TanStack Query with Polling

```typescript
function useImportJob(jobId: string) {
  return useQuery({
    queryKey: ["admin", "imports", jobId],
    queryFn: () => api.get(`imports/${jobId}`).json<GetImportResponse>(),
    refetchInterval: (query) => {
      const job = query.state.data
      if (job && isTerminalJob(job)) return false  // Stop polling
      return 3000  // Poll every 3 seconds
    },
    staleTime: 0,
  })
}
```

### Component with Type-Safe State Handling

```typescript
function ImportJobMonitor({ jobId }: { jobId: string }) {
  const { data: job } = useImportJob(jobId)

  if (!job) return <LoadingSpinner />

  // TypeScript narrows type based on status
  switch (job.status) {
    case "pending":
      return <div>Job queued...</div>

    case "processing":
      return <ProgressBar value={job.processed_records} max={job.total_records} />

    case "completed":
      return <div>Import completed at {job.completed_at}</div>

    case "failed":
      return <ErrorAlert message={job.error_message} onRetry={() => showRetryDialog(job)} />
  }
}
```

### React Hook Form with Zod Validation

```typescript
const userFormSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
  role: z.enum(["admin", "analyst", "viewer"]),
  is_active: z.boolean(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: "Passwords do not match", path: ["confirmPassword"] }
)

function UserCreateForm() {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
  })

  const onSubmit = async (values: UserFormValues) => {
    const { confirmPassword, ...request } = values
    const response = await api.post("users", { json: request }).json<CreateUserResponse>()
  }
}
```

## Design Decisions

### 1. Discriminated Unions vs. Single Interface

**Choice**: Discriminated unions (one interface per state)

**Rationale**:
- Compile-time safety for state-specific properties
- TypeScript automatically narrows types in conditionals
- Prevents accessing properties that don't exist in current state
- Matches state machine pattern of job lifecycle

**Alternative Rejected**: Single interface with all optional fields
- Less type safe
- Allows accessing properties that shouldn't exist in current state
- No automatic type narrowing

### 2. Explicit Null vs. Undefined

**Choice**: Explicit `| null` for all nullable fields

**Rationale**:
- API returns `null` for absent values (JSON standard)
- Clearer intent than `undefined`
- Works with strict null checks
- Consistent with existing codebase patterns

### 3. Separate Form Types

**Choice**: Dedicated form types (e.g., `UserFormValues`) separate from request types

**Rationale**:
- Forms may have UI-only fields (e.g., `confirmPassword`)
- Allows form-specific validation logic
- Clearer separation of concerns (UI vs. API)
- Easier to add UI enhancements without changing API types

### 4. Type Guards as Exported Functions

**Choice**: Export type guard functions alongside types

**Rationale**:
- Reusable across components
- Provides consistent type narrowing
- Runtime safety with compile-time benefits
- Better than inline type assertions

## Integration with Existing Codebase

### Imports from Existing Types

```typescript
import type { UserRole } from "./auth"
```

Reuses `UserRole` from existing auth types to maintain consistency.

### Pattern Consistency

The admin types follow the same patterns as existing type modules:

- **Similar to `src/types/lookup.ts`**: Job state discriminated unions (like `BatchGeocodeJob`)
- **Similar to `src/types/boundary.ts`**: Metadata interfaces with nullable fields
- **Similar to `src/types/auth.ts`**: User profile types with ISO 8601 timestamps

## Validation Status

- ✅ TypeScript compilation successful (no errors)
- ✅ All types align with spec.md requirements
- ✅ All types match API contracts from research.md
- ✅ Comprehensive JSDoc comments
- ✅ Type guards for runtime safety
- ✅ Utility functions for common operations
- ✅ File validation constants and types
- ✅ Error handling types

## Next Steps

### Immediate

1. ✅ Types created and validated
2. Create API client functions in `src/api/admin.ts`
3. Create custom hooks in `src/hooks/useAdminOperations.ts`
4. Implement file validation utilities in `src/lib/utils/file-validation.ts`

### Future Extensions

The type system is designed for extensibility:

- **Adding new import types**: Extend `ImportType` union
- **Adding job metadata**: Extend base interfaces with optional `metadata` field
- **Custom validation**: Extend `FileValidationError` type
- **Additional job states**: Add new state interfaces to unions

## Documentation

Comprehensive developer documentation created:

- **Type definitions**: `/src/types/admin.ts` (548 lines, fully documented)
- **Usage guide**: `/docs/admin-types-guide.md` (750+ lines)
  - Design principles
  - Type categories
  - Usage patterns
  - Best practices
  - Integration examples
  - Future extensions

## Summary

The admin feature type system provides:

1. **Type Safety**: Compile-time guarantees for all admin operations
2. **Developer Experience**: IntelliSense autocomplete and inline documentation
3. **Maintainability**: Clear contracts between UI and API
4. **Extensibility**: Easy to add new features without breaking existing code
5. **Runtime Safety**: Type guards and validation at boundaries

All types are production-ready and follow TypeScript best practices with strict type checking enabled.
