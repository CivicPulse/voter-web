# Admin Feature TypeScript Types Guide

## Overview

The admin feature type system (`src/types/admin.ts`) provides comprehensive, production-ready TypeScript types for admin operations. The design leverages advanced TypeScript patterns including discriminated unions, utility types, and type guards to ensure type safety throughout the admin workflow.

## Key Design Principles

### 1. Discriminated Unions for Job States

Import and export jobs use discriminated unions with `status` as the discriminant property. This enables:

- **Type-safe state handling**: TypeScript narrows types automatically in conditional blocks
- **Compile-time guarantees**: Access to state-specific properties is validated at compile time
- **Runtime type guards**: Helper functions provide runtime type checking

#### Example: Import Job States

```typescript
type ImportJob =
  | ImportJobPending
  | ImportJobProcessing
  | ImportJobCompleted
  | ImportJobFailed

// TypeScript narrows the type based on status
function handleJob(job: ImportJob) {
  if (job.status === "processing") {
    // TypeScript knows job is ImportJobProcessing
    console.log(`Progress: ${job.processed_records}/${job.total_records}`)
  } else if (job.status === "completed") {
    // TypeScript knows job is ImportJobCompleted
    console.log(`Completed at: ${job.completed_at}`)
  } else if (job.status === "failed") {
    // TypeScript knows job is ImportJobFailed
    console.log(`Error: ${job.error_message}`)
  }
}
```

### 2. Strict Null Safety

All nullable fields are explicitly typed with `| null` to prevent runtime errors:

```typescript
interface ImportJobFailed {
  // May be null if job failed before processing started
  started_at: string | null
  // Always present on failed jobs
  error_message: string
  // Partial progress metrics
  total_records: number | null
  processed_records: number | null
}
```

### 3. Separation of Concerns

Types are organized into logical sections:

- **Job Status Types**: Core discriminants and unions
- **User Management**: User entities and CRUD operations
- **Import Jobs**: Import-specific types and workflows
- **Export Jobs**: Export-specific types and workflows
- **Permission Errors**: Error handling types
- **Form Schemas**: React Hook Form integration
- **Utility Types**: Helper functions and type guards

## Type Categories

### Job Status Discriminated Unions

Both import and export jobs follow the same state machine pattern:

```
pending → processing → completed
                    ↘ failed
```

Each state has a dedicated interface with state-specific properties:

```typescript
// Pending: No progress data
interface ImportJobPending {
  status: "pending"
  started_at: null
  completed_at: null
  total_records: null
  // ...
}

// Processing: Active progress tracking
interface ImportJobProcessing {
  status: "processing"
  started_at: string
  completed_at: null
  total_records: number
  processed_records: number
  // ...
}

// Completed: Final success state
interface ImportJobCompleted {
  status: "completed"
  started_at: string
  completed_at: string
  total_records: number
  // ...
}

// Failed: Error state with diagnostics
interface ImportJobFailed {
  status: "failed"
  started_at: string | null
  completed_at: string
  error_message: string
  // ...
}
```

### User Management Types

#### AdminUser

Extended user profile with admin-specific metadata:

```typescript
interface AdminUser {
  id: string
  username: string
  email: string
  role: UserRole // "admin" | "analyst" | "viewer"
  is_active: boolean
  created_at: string
  last_login_at: string | null
}
```

#### CreateUserRequest

Type-safe request payload for user creation:

```typescript
interface CreateUserRequest {
  username: string
  email: string
  password: string
  role: UserRole
  is_active?: boolean // Optional, defaults to true
}
```

### API Request/Response Contracts

All API endpoints have corresponding request/response types:

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

React Hook Form integration types with additional UI fields:

```typescript
// User creation form (includes confirmPassword for UI)
interface UserFormValues {
  username: string
  email: string
  password: string
  confirmPassword: string // UI-only field
  role: UserRole
  is_active: boolean
}

// Import forms
interface VoterImportFormValues {
  file: File | null
}

interface BoundaryImportFormValues {
  file: File | null
  boundary_type: string
}
```

## Utility Functions and Type Guards

### Type Guards

Runtime type checking with TypeScript type narrowing:

```typescript
// Check if job is in active state (needs polling)
if (isActiveJob(job)) {
  // job is ImportJobPending | ImportJobProcessing
  startPolling()
}

// Check if job is terminal (stop polling)
if (isTerminalJob(job)) {
  // job is ImportJobCompleted | ImportJobFailed
  stopPolling()
}

// Narrow to specific state
if (isFailedImport(job)) {
  // job is ImportJobFailed
  showRetryButton(job.error_message)
}

if (isCompletedExport(job)) {
  // job is ExportJobCompleted
  showDownloadButton(job.download_url)
}
```

### Helper Functions

```typescript
// Calculate import progress percentage (0-100 or null)
const progress = getImportProgress(job)
if (progress !== null) {
  updateProgressBar(progress)
}
```

## File Validation

### Constants

```typescript
// Maximum upload size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024

// Voter import: CSV only
const VOTER_FILE_TYPES = ["text/csv", "application/csv", ".csv"]

// Boundary import: GeoJSON or zipped Shapefile
const BOUNDARY_FILE_TYPES = [
  "application/geo+json",
  "application/json",
  ".geojson",
  ".json",
  "application/zip",
  "application/x-zip-compressed",
  ".zip",
]
```

### Validation Types

```typescript
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

## Error Handling

### Permission Errors (HTTP 403)

```typescript
interface PermissionError {
  error: "permission_denied" | "insufficient_role"
  message: string
  required_role?: UserRole
  current_role?: UserRole
}
```

### Authentication Errors (HTTP 401)

```typescript
interface AuthenticationError {
  error: "unauthorized" | "token_expired" | "invalid_token"
  message: string
}
```

### Generic API Errors

```typescript
interface ApiError {
  status: number
  error: string
  message: string
  details?: Record<string, unknown>
}
```

## Usage Patterns

### TanStack Query with Discriminated Unions

```typescript
// Import job status polling
function useImportJob(jobId: string) {
  return useQuery({
    queryKey: ["admin", "imports", jobId],
    queryFn: () => api.get(`imports/${jobId}`).json<GetImportResponse>(),
    refetchInterval: (query) => {
      const job = query.state.data
      // Stop polling when job reaches terminal state
      if (job && isTerminalJob(job)) return false
      // Poll every 3 seconds for active jobs
      return 3000
    },
    staleTime: 0,
  })
}

// Usage in component
function ImportJobMonitor({ jobId }: { jobId: string }) {
  const { data: job } = useImportJob(jobId)

  if (!job) return <LoadingSpinner />

  // TypeScript narrows job type based on status
  switch (job.status) {
    case "pending":
      return <div>Job queued...</div>

    case "processing":
      return (
        <ProgressBar
          value={job.processed_records}
          max={job.total_records}
        />
      )

    case "completed":
      return <div>Import completed at {job.completed_at}</div>

    case "failed":
      return (
        <ErrorAlert
          message={job.error_message}
          onRetry={() => showRetryDialog(job)}
        />
      )
  }
}
```

### React Hook Form + Zod Validation

```typescript
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const userFormSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(["admin", "analyst", "viewer"]),
  is_active: z.boolean(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
)

function UserCreateForm() {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      is_active: true,
    },
  })

  const onSubmit = async (values: UserFormValues) => {
    // Remove UI-only field before API request
    const { confirmPassword, ...request } = values
    const response = await api
      .post("users", { json: request })
      .json<CreateUserResponse>()
    // response is typed as AdminUser
  }

  return <Form {...form} />
}
```

### File Upload with Validation

```typescript
import { VOTER_FILE_TYPES, MAX_FILE_SIZE } from "@/types/admin"

const importSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    )
    .refine(
      (file) =>
        VOTER_FILE_TYPES.some((type) =>
          type.startsWith(".")
            ? file.name.endsWith(type)
            : file.type === type
        ),
      "File must be CSV format"
    ),
})

function VoterImportDialog() {
  const form = useForm<VoterImportFormValues>({
    resolver: zodResolver(importSchema),
  })

  const onSubmit = async (values: VoterImportFormValues) => {
    const formData = new FormData()
    formData.append("file", values.file!)

    const response = await api
      .post("imports/voters", { body: formData })
      .json<CreateImportResponse>()
    // response is typed as ImportJobPending
  }

  return <Form {...form} />
}
```

## Best Practices

### 1. Always Use Type Guards for Job States

```typescript
// ✅ Good: Type-safe narrowing
if (isFailedImport(job)) {
  showRetryButton(job.error_message) // TypeScript knows error_message exists
}

// ❌ Bad: Manual status checking without type guard
if (job.status === "failed") {
  // TypeScript still sees job as ImportJob union
  showRetryButton(job.error_message) // May error if not narrowed
}
```

### 2. Leverage Discriminated Unions in Switch Statements

```typescript
// ✅ Good: Exhaustive switch with type narrowing
function getJobStatusBadge(job: ImportJob) {
  switch (job.status) {
    case "pending":
      return <Badge variant="secondary">Pending</Badge>
    case "processing":
      return <Badge variant="default">Processing</Badge>
    case "completed":
      return <Badge variant="success">Completed</Badge>
    case "failed":
      return <Badge variant="destructive">Failed</Badge>
    // TypeScript ensures all cases are handled
  }
}
```

### 3. Use Utility Types for API Response Transformations

```typescript
// Pick specific fields for table display
type ImportJobTableRow = Pick<
  ImportJob,
  "id" | "filename" | "import_type" | "status" | "created_at"
>

// Omit sensitive fields from logs
type ImportJobLog = Omit<ImportJob, "error_message">

// Make fields optional for partial updates
type PartialUserUpdate = Partial<Pick<AdminUser, "email" | "is_active">>
```

### 4. Document Complex Type Relationships

```typescript
/**
 * Import job retry flow:
 * 1. User clicks retry on failed import
 * 2. UI opens upload dialog pre-configured with job.import_type
 * 3. User selects corrected file
 * 4. Creates NEW import job (API has no PATCH endpoint)
 * 5. Original failed job remains for audit trail
 */
function handleRetry(failedJob: ImportJobFailed) {
  openUploadDialog({
    importType: failedJob.import_type,
    previousJobId: failedJob.id,
  })
}
```

## Type Safety Guarantees

The admin type system provides compile-time guarantees for:

1. **Job state transitions**: Cannot access properties that don't exist in current state
2. **API contracts**: Request/response types match OpenAPI specification
3. **Form validation**: Zod schemas align with TypeScript types
4. **Null safety**: Explicit `| null` annotations prevent undefined errors
5. **Exhaustive handling**: Switch statements must handle all discriminated union cases
6. **File validation**: Type-safe constants for allowed file types and sizes

## Integration with Existing Types

The admin types extend and complement existing type modules:

```typescript
// Reuses UserRole from auth.ts
import type { UserRole } from "./auth"

// AdminUser extends UserProfile concept
interface AdminUser {
  role: UserRole
  // ... other fields from GET /auth/me
}

// Follows same patterns as lookup.ts
interface ImportJob {
  status: JobStatus // Similar to BatchGeocodeJob.status
  // ... other fields
}
```

## Future Extensions

The type system is designed for extensibility:

### Adding New Import Types

```typescript
// Extend ImportType union
type ImportType = "voters" | "boundaries" | "census_data" | "custom"

// Add type-specific request
interface CreateCensusImportRequest {
  file: File
  census_year: number
  dataset_type: string
}
```

### Adding Job Metadata

```typescript
// Extend job base with optional metadata
interface ImportJobBase {
  id: string
  filename: string
  import_type: ImportType
  created_at: string
  metadata?: Record<string, unknown> // Extensible metadata field
}
```

### Adding Custom Validation

```typescript
// Extend FileValidationError with custom types
interface FileValidationError {
  type: "size" | "type" | "unknown" | "content_invalid" | "virus_detected"
  message: string
  // ... other fields
}
```

## TypeScript Configuration Notes

The admin types are designed to work with strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

All types pass strict type checking without `any` or type assertions.

## Conclusion

The admin feature type system provides:

- **Type safety**: Compile-time guarantees for all admin operations
- **Developer experience**: IntelliSense autocomplete and inline documentation
- **Maintainability**: Clear contracts between UI and API
- **Extensibility**: Easy to add new features without breaking existing code
- **Runtime safety**: Type guards and validation at boundaries

Follow the patterns and best practices in this guide to maintain type safety throughout the admin feature implementation.
