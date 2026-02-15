# Data Model: Admin API Access

**Date**: 2026-02-14
**Feature**: Admin API Access
**Phase**: 1 (Design & Contracts)

## Overview

The admin feature introduces 4 primary entities with clear state machines for asynchronous job processing. All types are defined in `src/types/admin.ts` with full TypeScript strict mode compliance.

---

## Entity Definitions

### 1. Admin User

**Purpose**: Represents a system user with role-based permissions

**Source**: `GET /api/v1/auth/me` endpoint

**TypeScript Type**: `AdminUser`

```typescript
interface AdminUser {
  id: string
  username: string
  email: string
  role: UserRole  // "admin" | "analyst" | "viewer"
  is_active: boolean
  created_at: string  // ISO 8601 datetime
  last_login_at: string | null
}
```

**Relationships**:
- Users create Import Jobs (via POST /imports/voters, POST /imports/boundaries)
- Users create Export Jobs (via POST /exports)
- User role determines UI visibility and API access

**Validation Rules**:
- `email`: Must be valid email format
- `username`: Min 3 chars, max 50 chars, alphanumeric + underscore
- `role`: One of predefined UserRole values
- `password` (on creation): Min 8 chars, requires letter + number

**State**: Stateless entity (no state machine)

---

### 2. Import Job

**Purpose**: Tracks asynchronous voter or boundary data import process

**Source**: `POST /api/v1/imports/voters`, `POST /api/v1/imports/boundaries`, `GET /api/v1/imports/{id}`

**TypeScript Type**: `ImportJob` (discriminated union)

**States**:

```typescript
type ImportJob =
  | PendingImportJob
  | ProcessingImportJob
  | CompletedImportJob
  | FailedImportJob
```

**Common Fields** (all states):
```typescript
{
  id: string
  filename: string
  import_type: "voter" | "boundary"
  created_at: string  // ISO 8601
  status: ImportJobStatus  // Discriminant field
}
```

**State-Specific Fields**:

**Pending**:
```typescript
{
  status: "pending"
  started_at: null
  completed_at: null
  error_message: null
}
```

**Processing**:
```typescript
{
  status: "processing"
  started_at: string  // ISO 8601
  completed_at: null
  error_message: null
  total_records: number
  processed_records: number
}
```

**Completed**:
```typescript
{
  status: "completed"
  started_at: string
  completed_at: string
  error_message: null
  total_records: number
  processed_records: number
  succeeded_records: number
}
```

**Failed**:
```typescript
{
  status: "failed"
  started_at: string | null
  completed_at: string
  error_message: string  // Required for failed state
  total_records: number | null
  processed_records: number | null
}
```

**State Machine**:

```
pending ──> processing ──> completed
               │
               └──────────> failed
```

**Transitions**:
- `pending` → `processing`: When worker picks up job
- `processing` → `completed`: All records processed successfully
- `processing` → `failed`: Unrecoverable error encountered

**Validation Rules**:
- File type: CSV for voters, GeoJSON/shapefile for boundaries
- File size: Max 100MB (client-side validation)
- Content validation: Performed by API (CSV structure, GeoJSON validity)

**Retry Behavior**:
- Failed imports can be retried via UI
- Retry creates NEW import job (not PATCH existing)
- User must upload corrected file

---

### 3. Export Job

**Purpose**: Tracks asynchronous bulk data export generation

**Source**: `POST /api/v1/exports`, `GET /api/v1/exports/{id}`, `GET /api/v1/exports/{id}/download`

**TypeScript Type**: `ExportJob` (discriminated union)

**States**:

```typescript
type ExportJob =
  | PendingExportJob
  | ProcessingExportJob
  | CompletedExportJob
  | FailedExportJob
```

**Common Fields** (all states):
```typescript
{
  id: string
  export_type: string  // e.g., "voters", "boundaries", "full"
  created_at: string  // ISO 8601
  status: ExportJobStatus  // Discriminant field
}
```

**State-Specific Fields**:

**Pending**:
```typescript
{
  status: "pending"
  started_at: null
  completed_at: null
  error_message: null
  download_url: null
}
```

**Processing**:
```typescript
{
  status: "processing"
  started_at: string
  completed_at: null
  error_message: null
  download_url: null
}
```

**Completed**:
```typescript
{
  status: "completed"
  started_at: string
  completed_at: string
  error_message: null
  download_url: string  // Required for completed exports
}
```

**Failed**:
```typescript
{
  status: "failed"
  started_at: string | null
  completed_at: string
  error_message: string  // Required for failed state
  download_url: null
}
```

**State Machine**:

```
pending ──> processing ──> completed (download_url available)
               │
               └──────────> failed (no download_url)
```

**Transitions**:
- `pending` → `processing`: When worker picks up job
- `processing` → `completed`: Export file generated successfully
- `processing` → `failed`: Error during export generation

**Retry Behavior**:
- NO retry button for failed exports (spec requirement)
- User must create new export request

---

### 4. Permission Error

**Purpose**: Represents API permission/auth errors

**Source**: HTTP 403 Forbidden, HTTP 401 Unauthorized responses

**TypeScript Type**: `PermissionError`, `AuthenticationError`

```typescript
interface PermissionError {
  statusCode: 403
  message: string
  detail?: string
}

interface AuthenticationError {
  statusCode: 401
  message: string
  detail?: string
}
```

**Handling**:
- 401: Automatic token refresh attempt (handled by `ky` client)
- 403: Show access denied message, hide admin UI elements
- Display error to user with clear actionable message

---

## Derived Types

### Form Values (UI Layer)

**UserFormValues**: User creation form
```typescript
{
  username: string
  email: string
  password: string
  confirmPassword: string  // UI-only field, not sent to API
  role: UserRole
}
```

**VoterImportFormValues**: Voter import upload
```typescript
{
  file: File
}
```

**BoundaryImportFormValues**: Boundary import upload
```typescript
{
  file: File
  import_type: "geojson" | "shapefile"
}
```

**ExportFormValues**: Export request
```typescript
{
  export_type: string
}
```

### API Contracts (Network Layer)

**CreateUserRequest**: POST /users payload
```typescript
{
  username: string
  email: string
  password: string
  role: UserRole
}
```

**ImportJobResponse**: Response from POST /imports/*
```typescript
{
  id: string
  status: "pending"
  import_type: "voter" | "boundary"
  filename: string
  created_at: string
}
```

**ExportJobResponse**: Response from POST /exports
```typescript
{
  id: string
  status: "pending"
  export_type: string
  created_at: string
}
```

---

## Type Guards & Utilities

### Job Status Checks

```typescript
function isActiveJob(job: ImportJob | ExportJob): boolean
// Returns true for pending/processing, false for completed/failed
// Used to determine if polling should continue

function isTerminalJob(job: ImportJob | ExportJob): boolean
// Returns true for completed/failed, false for pending/processing
// Used to stop polling

function isFailedImport(job: ImportJob): job is FailedImportJob
// TypeScript type guard for failed imports
// Enables access to error_message property

function isCompletedExport(job: ExportJob): job is CompletedExportJob
// TypeScript type guard for completed exports
// Enables access to download_url property
```

### File Validation

```typescript
const MAX_FILE_SIZE = 100 * 1024 * 1024  // 100MB

const VOTER_FILE_TYPES = ["text/csv", ".csv"]

const BOUNDARY_FILE_TYPES = [
  "application/geo+json",
  ".geojson",
  ".json",
  "application/zip",
  ".zip",
  ".shp"
]
```

---

## Relationships Diagram

```
AdminUser ──(creates)──> ImportJob
     │
     └──(creates)──> ExportJob

ImportJob ──(becomes)──> [pending → processing → completed/failed]
ExportJob ──(becomes)──> [pending → processing → completed/failed]

FailedImportJob ──(can retry)──> new ImportJob (via POST)
CompletedExportJob ──(provides)──> download_url
```

---

## State Invariants

### Import Jobs

- `pending`: `started_at`, `completed_at`, `error_message` must be `null`
- `processing`: `started_at` must be non-null, `completed_at` must be `null`
- `completed`: `started_at`, `completed_at` must be non-null, `error_message` must be `null`
- `failed`: `error_message` must be non-null, `completed_at` must be non-null

### Export Jobs

- `pending`: `started_at`, `completed_at`, `download_url` must be `null`
- `processing`: `started_at` must be non-null, other timestamp fields `null`
- `completed`: All timestamps non-null, `download_url` must be non-null
- `failed`: `error_message` must be non-null, `download_url` must be `null`

---

## Implementation Notes

### Discriminated Unions

TypeScript automatically narrows types based on the `status` field:

```typescript
function handleImportJob(job: ImportJob) {
  if (job.status === "failed") {
    // TypeScript knows job is FailedImportJob here
    console.log(job.error_message)  // ✅ No type error
  }

  if (job.status === "completed") {
    // TypeScript knows job is CompletedImportJob here
    console.log(job.succeeded_records)  // ✅ No type error
  }
}
```

### TanStack Query Integration

Jobs are fetched and cached using TanStack Query:

```typescript
useQuery({
  queryKey: ["admin", "imports", jobId],
  queryFn: () => getImportJob(jobId),
  refetchInterval: (query) => {
    const job = query.state.data
    return isTerminalJob(job) ? false : 3000  // Stop polling when done
  },
})
```

### Zod Validation

Forms use Zod schemas for validation:

```typescript
const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Za-z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
  role: z.enum(["admin", "analyst", "viewer"]),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
```

---

## References

- **Type Definitions**: `src/types/admin.ts`
- **API Contracts**: `specs/001-admin-api-access/contracts/admin-api.d.ts`
- **Zod Schemas**: (to be created in `src/lib/schemas/user-form.ts`, etc.)
- **API Client**: `src/lib/api/admin.ts` (to be created)
- **Hooks**: `src/lib/hooks/use-import-jobs.ts`, `use-export-jobs.ts` (to be created)

---

**Data Model Status**: ✅ Complete
**TypeScript Types**: ✅ Created (`src/types/admin.ts`)
**Next Step**: Create API contracts and quickstart guide
