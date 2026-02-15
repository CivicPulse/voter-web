# Admin Feature TypeScript Types - Complete Implementation

**Status**: ✅ Complete
**Created**: 2026-02-14
**TypeScript Version**: 5.x (strict mode)
**Phase**: Data Model Implementation

## Quick Start

The admin feature type system is ready for use:

```typescript
// Import types
import {
  type AdminUser,
  type ImportJob,
  type ExportJob,
  type CreateUserRequest,
  isActiveJob,
  isTerminalJob,
  getImportProgress,
} from "@/types/admin"

// Use in components
function JobMonitor({ job }: { job: ImportJob }) {
  if (isActiveJob(job)) {
    const progress = getImportProgress(job)
    return <ProgressBar value={progress ?? 0} />
  }

  if (isTerminalJob(job)) {
    return job.status === "completed" ? <SuccessMessage /> : <ErrorMessage />
  }

  return <LoadingSpinner />
}
```

## Files Overview

### Core Implementation

| File | Lines | Purpose |
|------|-------|---------|
| `/src/types/admin.ts` | 548 | Production-ready type definitions |
| `/docs/admin-types-guide.md` | 633 | Comprehensive usage guide |
| `/specs/001-admin-api-access/TYPES_SUMMARY.md` | 450+ | Implementation summary |
| `/specs/001-admin-api-access/zod-schemas-example.ts` | 350+ | Zod validation examples |

### Type Coverage

- **35 exported types/interfaces**: Complete coverage of admin domain
- **8 utility functions/constants**: Type guards and helpers
- **4 discriminated unions**: Type-safe state machines
- **100% strict TypeScript**: No `any` types or unsafe casts

## What's Included

### 1. Job State Management (Discriminated Unions)

Type-safe job state machines with automatic type narrowing:

```typescript
type ImportJob =
  | ImportJobPending      // Queued, not started
  | ImportJobProcessing   // Active with progress
  | ImportJobCompleted    // Successfully finished
  | ImportJobFailed       // Error state

type ExportJob =
  | ExportJobPending
  | ExportJobProcessing
  | ExportJobCompleted    // Includes download_url
  | ExportJobFailed
```

**Benefits**:
- TypeScript narrows types automatically in switch/if blocks
- Compile-time safety for state-specific properties
- Impossible to access properties that don't exist in current state

### 2. User Management

Complete user CRUD types:

```typescript
interface AdminUser {
  id: string
  username: string
  email: string
  role: "admin" | "analyst" | "viewer"
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
```

### 3. API Request/Response Contracts

Type-safe API integration:

```typescript
// User management
POST /users: CreateUserRequest → CreateUserResponse
GET /users: void → UserListResponse

// Imports
POST /imports/voters: CreateVoterImportRequest → CreateImportResponse
POST /imports/boundaries: CreateBoundaryImportRequest → CreateImportResponse
GET /imports/{id}: void → GetImportResponse
GET /imports: void → ImportListResponse

// Exports
POST /exports: CreateExportRequest → CreateExportResponse
GET /exports/{id}: void → GetExportResponse
GET /exports: void → ExportListResponse
```

### 4. Form Validation Types

React Hook Form + Zod integration:

```typescript
interface UserFormValues {
  username: string
  email: string
  password: string
  confirmPassword: string  // UI-only field
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
```

### 5. File Validation

Type-safe file upload validation:

```typescript
const MAX_FILE_SIZE = 100 * 1024 * 1024  // 100MB

const VOTER_FILE_TYPES = ["text/csv", "application/csv", ".csv"]

const BOUNDARY_FILE_TYPES = [
  "application/geo+json",
  "application/json",
  ".geojson",
  ".json",
  "application/zip",
  ".zip",
]

interface FileValidationError {
  type: "size" | "type" | "unknown"
  message: string
  maxSize?: number
  actualSize?: number
  allowedTypes?: readonly string[]
}

type FileValidationResult = true | FileValidationError
```

### 6. Error Types

Comprehensive error handling:

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

### 7. Utility Functions

Runtime type checking with compile-time benefits:

```typescript
// Type guards
function isActiveJob(job: ImportJob | ExportJob): boolean
function isTerminalJob(job: ImportJob | ExportJob): boolean
function isFailedImport(job: ImportJob): job is ImportJobFailed
function isCompletedExport(job: ExportJob): job is ExportJobCompleted

// Helpers
function getImportProgress(job: ImportJob): number | null
```

## Design Patterns

### Discriminated Unions for State Machines

Each job state is a separate interface with a discriminant `status` property:

```typescript
// TypeScript automatically narrows the type
function handleJob(job: ImportJob) {
  switch (job.status) {
    case "pending":
      // job is ImportJobPending - can't access processed_records
      return "Queued"

    case "processing":
      // job is ImportJobProcessing - processed_records is number
      return `${job.processed_records}/${job.total_records}`

    case "completed":
      // job is ImportJobCompleted - completed_at is string
      return `Done at ${job.completed_at}`

    case "failed":
      // job is ImportJobFailed - error_message is string
      return `Error: ${job.error_message}`
  }
}
```

### Explicit Null Safety

All nullable fields use `| null` (not `undefined`):

```typescript
interface ImportJobFailed {
  started_at: string | null       // Explicitly nullable
  error_message: string            // Never null
  total_records: number | null     // Explicitly nullable
}

// Safe access
if (job.started_at !== null) {
  console.log(job.started_at)  // TypeScript knows it's string
}
```

### Separation of UI and API Types

Form types include UI-only fields:

```typescript
// API request (no confirmPassword)
interface CreateUserRequest {
  username: string
  email: string
  password: string
  role: UserRole
}

// Form values (includes confirmPassword for validation)
interface UserFormValues extends CreateUserRequest {
  confirmPassword: string
}

// Usage
const onSubmit = (values: UserFormValues) => {
  const { confirmPassword, ...request } = values
  api.post("users", { json: request })  // Type-safe!
}
```

## Usage Examples

### TanStack Query Polling

```typescript
function useImportJob(jobId: string) {
  return useQuery({
    queryKey: ["admin", "imports", jobId],
    queryFn: () => api.get(`imports/${jobId}`).json<GetImportResponse>(),
    refetchInterval: (query) => {
      const job = query.state.data
      if (job && isTerminalJob(job)) return false  // Stop polling
      return 3000  // Poll active jobs every 3s
    },
    staleTime: 0,
  })
}
```

### React Hook Form with Zod

```typescript
import { zodResolver } from "@hookform/resolvers/zod"
import { userFormSchema } from "@/lib/schemas/admin"

function UserCreateForm() {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { is_active: true },
  })

  const onSubmit = async (values: UserFormValues) => {
    const { confirmPassword, ...request } = values
    await api.post("users", { json: request }).json<CreateUserResponse>()
  }

  return <Form {...form} />
}
```

### File Upload Validation

```typescript
import { VOTER_FILE_TYPES, MAX_FILE_SIZE } from "@/types/admin"

const voterImportSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `File must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    )
    .refine(
      (file) => VOTER_FILE_TYPES.some(type =>
        type.startsWith(".")
          ? file.name.endsWith(type)
          : file.type === type
      ),
      "File must be CSV format"
    ),
})
```

### Type-Safe Job Monitoring

```typescript
function ImportJobStatus({ job }: { job: ImportJob }) {
  // Type-safe exhaustive switch
  switch (job.status) {
    case "pending":
      return <Badge>Queued</Badge>

    case "processing":
      const progress = (job.processed_records / job.total_records) * 100
      return <ProgressBar value={progress} />

    case "completed":
      return (
        <div>
          <Badge variant="success">Complete</Badge>
          <p>{job.processed_records} records imported</p>
          {job.failed_records > 0 && (
            <p className="text-warning">{job.failed_records} failed</p>
          )}
        </div>
      )

    case "failed":
      return (
        <Alert variant="destructive">
          <AlertTitle>Import Failed</AlertTitle>
          <AlertDescription>{job.error_message}</AlertDescription>
          <Button onClick={() => showRetryDialog(job)}>Retry</Button>
        </Alert>
      )
  }
}
```

## Alignment with Specification

All types align with requirements from `/specs/001-admin-api-access/spec.md`:

| Requirement | Implementation |
|-------------|----------------|
| FR-001: Role-based UI | `UserRole` type from existing auth types |
| FR-005: User management | `AdminUser`, `CreateUserRequest`, `UserListResponse` |
| FR-006: Import operations | `ImportJob` discriminated union, `CreateVoterImportRequest`, `CreateBoundaryImportRequest` |
| FR-007: Export operations | `ExportJob` discriminated union, `CreateExportRequest` with `download_url` |
| FR-008: Job states | `JobStatus` type with 4 states: pending, processing, completed, failed |
| FR-010: Permission errors | `PermissionError`, `AuthenticationError` types |
| FR-021-024: File validation | `MAX_FILE_SIZE`, `VOTER_FILE_TYPES`, `BOUNDARY_FILE_TYPES`, `FileValidationError` |

## API Contract Verification

Types match API endpoints from `/specs/001-admin-api-access/research.md`:

```
✅ GET /api/v1/auth/me → UserProfile (existing type, role field used)
✅ GET /api/v1/users → UserListResponse
✅ POST /api/v1/users → CreateUserRequest → CreateUserResponse
✅ POST /api/v1/imports/voters → CreateVoterImportRequest → CreateImportResponse
✅ POST /api/v1/imports/boundaries → CreateBoundaryImportRequest → CreateImportResponse
✅ GET /api/v1/imports/{id} → GetImportResponse (ImportJob)
✅ GET /api/v1/imports → ImportListResponse
✅ POST /api/v1/exports → CreateExportRequest → CreateExportResponse
✅ GET /api/v1/exports/{id} → GetExportResponse (ExportJob)
✅ GET /api/v1/exports → ExportListResponse
```

## Type Safety Guarantees

This type system provides compile-time guarantees for:

1. **State transitions**: Can't access properties that don't exist in current job state
2. **API contracts**: Request/response types match OpenAPI spec exactly
3. **Form validation**: Zod schemas infer to correct TypeScript types
4. **Null safety**: Explicit `| null` prevents undefined access errors
5. **Exhaustive handling**: Switch statements must handle all union cases
6. **File validation**: Type-safe constants for allowed types and sizes

## Next Steps

### Immediate Next Phase

1. ✅ Types complete and validated
2. **Create API client functions** (`src/api/admin.ts`)
   - User management endpoints
   - Import job endpoints
   - Export job endpoints
3. **Create custom hooks** (`src/hooks/useAdminOperations.ts`)
   - `useUserList()`
   - `useImportJob(jobId)`
   - `useExportJob(jobId)`
   - `useCreateUser()`
   - `useCreateImport()`
4. **Create file validation utilities** (`src/lib/utils/file-validation.ts`)
   - `validateFileType()`
   - `validateFileSize()`
   - `formatFileSize()`

### Future Extensions

The type system supports easy extension:

```typescript
// Add new import type
type ImportType = "voters" | "boundaries" | "census_data"

// Add job metadata
interface ImportJobBase {
  metadata?: Record<string, unknown>
}

// Add custom validation
interface FileValidationError {
  type: "size" | "type" | "unknown" | "virus_detected"
}
```

## Documentation

- **Type definitions**: `/src/types/admin.ts` (548 lines, JSDoc comments)
- **Usage guide**: `/docs/admin-types-guide.md` (633 lines, comprehensive examples)
- **Implementation summary**: `/specs/001-admin-api-access/TYPES_SUMMARY.md`
- **Zod examples**: `/specs/001-admin-api-access/zod-schemas-example.ts`

## Validation Status

- ✅ TypeScript compilation successful (strict mode)
- ✅ All 35 types defined
- ✅ All 8 utility functions implemented
- ✅ Aligns with spec.md requirements
- ✅ Matches API contracts from research.md
- ✅ Comprehensive JSDoc documentation
- ✅ Type guards for runtime safety
- ✅ File validation constants
- ✅ Error handling types
- ✅ Form schema types

## Summary

The admin feature type system is **production-ready** and provides:

- **Type safety**: Compile-time guarantees for all operations
- **Developer experience**: IntelliSense, autocomplete, inline docs
- **Maintainability**: Clear contracts between UI and API
- **Extensibility**: Easy to add features without breaking changes
- **Runtime safety**: Type guards and validation at boundaries

All types follow TypeScript best practices and integrate seamlessly with the existing codebase patterns.
