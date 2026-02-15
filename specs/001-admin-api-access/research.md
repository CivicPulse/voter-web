# Research: Admin API Access Implementation

**Date**: 2026-02-14
**Feature**: Admin API Access
**Phase**: 0 (Research & Decisions)

## Summary

Research completed for implementing admin UI features with role-based access, job status polling, file upload validation, and confirmation dialogs. All unknowns from the technical context have been resolved through codebase analysis and API specification review.

---

## 1. TanStack Query Polling Patterns

### Decision
**Use functional `refetchInterval` with conditional logic to auto-poll active jobs and stop when jobs reach terminal states.**

### Rationale
The codebase already has a proven polling pattern in `src/hooks/useAddressLookup.ts` for batch geocoding jobs. This pattern:
- Polls every 3 seconds for active jobs (pending/running)
- Automatically stops when jobs reach terminal states (completed/failed)
- Handles errors gracefully with retry logic
- Uses `staleTime: 0` to keep polled data fresh

### Implementation Pattern

```typescript
export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["admin", "jobs", jobId],
    queryFn: () => getJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      // Stop polling for terminal states
      if (status === "completed" || status === "failed") return false
      // Continue polling every 3 seconds
      return 3000
    },
    staleTime: 0,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
}
```

### Alternatives Considered
- **WebSocket/Server-Sent Events**: Rejected because requires backend changes and adds complexity
- **Manual refresh button only**: Rejected because poor UX for job monitoring
- **Static refetchInterval**: Rejected because doesn't stop when jobs complete, wastes network

### Error Handling Strategy
- Network blips: `retry: 2` with exponential backoff, slower polling (5s) on error
- 401 Unauthorized: Handled automatically by `ky` client (token refresh + retry)
- 404 Not Found: Stop polling, show error
- 5xx Server errors: Retry with normal interval (transient)

### Reference
- **Existing pattern**: `src/hooks/useAddressLookup.ts` (lines 62-75)
- **Job types**: `src/types/lookup.ts` (lines 65-76)
- **HTTP client**: `src/api/client.ts` (already configured with JWT auth)

---

## 2. User Role and Authentication

### Decision
**Fetch user role via `GET /api/v1/auth/me` endpoint and cache in Zustand store.**

### Rationale
The voter-api provides a `/api/v1/auth/me` endpoint that returns:
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": "admin" | "analyst" | "viewer",
  "is_active": boolean,
  "created_at": "datetime",
  "last_login_at": "datetime"
}
```

This endpoint:
- Requires OAuth2 Bearer token (already handled by `ky` client in `src/api/client.ts`)
- Returns complete user profile including role
- Is more reliable than decoding JWT client-side

### Implementation Approach

**Step 1: Zustand Store Extension**
```typescript
// src/lib/stores/auth-store.ts
interface AuthState {
  accessToken: string | null
  userRole: string | null  // NEW
  setAccessToken: (token: string | null) => void
  setUserRole: (role: string | null) => void  // NEW
  logout: () => void
}
```

**Step 2: API Client Function**
```typescript
// src/lib/api/admin.ts
export async function getCurrentUser() {
  return client.get("auth/me").json<UserResponse>()
}
```

**Step 3: Custom Hook**
```typescript
// src/lib/hooks/use-user-role.ts
export function useUserRole() {
  const { userRole, setUserRole } = useAuthStore()

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const user = await getCurrentUser()
      setUserRole(user.role)
      return user
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!useAuthStore.getState().accessToken,
  })
}
```

### Alternatives Considered
- **Decode JWT client-side**: Rejected because less reliable, adds dependency, role might not be in token
- **Store role in localStorage**: Rejected because can become stale if role changes
- **Fetch role on every navigation**: Rejected because inefficient, solved by TanStack Query caching

### Reference
- **API endpoint**: `GET /api/v1/auth/me` (from OpenAPI spec)
- **Existing auth client**: `src/api/client.ts` (ky with JWT bearer token)
- **Existing store**: `src/lib/stores/auth-store.ts` (to be extended)

---

## 3. File Upload with Validation

### Decision
**Use React Hook Form with custom file validation for type and size before upload.**

### Rationale
Requirements:
- Client-side validation for file type (CSV for voters, GeoJSON/shapefile for boundaries)
- Client-side validation for file size (100MB maximum)
- Clear error messages before upload attempt

React Hook Form already used in the project, and shadcn/ui Form components integrate seamlessly.

### Implementation Pattern

**File Validation Utility**
```typescript
// src/lib/utils/file-validation.ts
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB in bytes

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith("/*")) {
      const prefix = type.slice(0, -2)
      return file.type.startsWith(prefix)
    }
    return file.type === type || file.name.endsWith(type)
  })
}

export function validateFileSize(file: File, maxSize: number = MAX_FILE_SIZE): boolean {
  return file.size <= maxSize
}

export const VOTER_FILE_TYPES = ["text/csv", ".csv"]
export const BOUNDARY_FILE_TYPES = ["application/geo+json", ".geojson", ".json", "application/zip", ".zip", ".shp"]
```

**Form Integration**
```typescript
// In import upload dialog
const form = useForm<ImportFormValues>({
  resolver: zodResolver(importSchema),
})

const importSchema = z.object({
  file: z
    .instanceof(File)
    .refine(file => validateFileSize(file), "File size must be less than 100MB")
    .refine(file => validateFileType(file, VOTER_FILE_TYPES), "File must be CSV format"),
})
```

### Alternatives Considered
- **No client-side validation**: Rejected because poor UX (user uploads large file, waits, then gets error)
- **Comprehensive CSV parsing client-side**: Rejected because duplicates backend logic, spec says "rely on API for content validation"
- **Different size limits per file type**: Rejected because spec specifies single 100MB limit

### Reference
- **Existing forms**: `src/components/ui/form.tsx` (shadcn/ui form components)
- **React Hook Form**: Already in `package.json` v7.71+
- **Zod validation**: Already in `package.json` v4.3+

---

## 4. Confirmation Dialog Patterns

### Decision
**Use shadcn/ui Dialog component with file details display before triggering import/export.**

### Rationale
Requirements:
- Confirm before triggering import jobs (show file details)
- Confirm before creating users with elevated roles (show role being assigned)
- No confirmation for read-only operations

shadcn/ui Dialog provides accessible, keyboard-navigable confirmation dialogs.

### Implementation Pattern

**Confirmation Flow**
```typescript
// Import upload with confirmation
function ImportUploadDialog() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleFileSelect = (file: File) => {
    // Validate first
    if (!validateFileSize(file) || !validateFileType(file, VOTER_FILE_TYPES)) {
      // Show error
      return
    }
    setSelectedFile(file)
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    if (!selectedFile) return
    await uploadImport(selectedFile)
    setShowConfirm(false)
    setSelectedFile(null)
  }

  return (
    <>
      <input type="file" onChange={(e) => handleFileSelect(e.target.files?.[0])} />

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
          </DialogHeader>
          <div>
            <p>File: {selectedFile?.name}</p>
            <p>Size: {formatFileSize(selectedFile?.size)}</p>
            <p>Type: Voter Import</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={handleConfirm}>Confirm Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

### Alternatives Considered
- **Browser confirm()**: Rejected because not customizable, poor UX
- **Toast/alert only**: Rejected because spec requires confirmation dialog
- **Multi-step wizard**: Rejected because over-engineering for this use case

### Reference
- **shadcn/ui Dialog**: `src/components/ui/dialog.tsx` (to be added via `npx shadcn@latest add dialog`)
- **Existing patterns**: Similar to form submission patterns in the codebase

---

## 5. Empty State Patterns

### Decision
**Create reusable EmptyState component with icon, message, description, and action button.**

### Rationale
Requirements:
- Helpful empty states for: no users, no import jobs, no export jobs
- Each empty state should have: descriptive message, guidance text, primary action button

### Implementation Pattern

**EmptyState Component**
```typescript
// src/components/ui/empty-state.tsx
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-muted-foreground">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 text-sm text-muted-foreground max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
```

**Usage Example**
```typescript
// In user list page
{users.length === 0 ? (
  <EmptyState
    icon={<Users className="h-12 w-12" />}
    title="No users yet"
    description="Create your first user to get started with user management."
    action={{
      label: "Create User",
      onClick: () => navigate("/admin/users/create")
    }}
  />
) : (
  <UserTable users={users} />
)}
```

### Alternatives Considered
- **Inline empty state per component**: Rejected because code duplication
- **Just show empty table with headers**: Rejected because poor UX, spec requires helpful guidance
- **Rich illustrations**: Rejected because over-engineering, simple icon is sufficient

### Reference
- **Lucide icons**: Already in `package.json` for icons
- **Button component**: `src/components/ui/button.tsx` (existing shadcn/ui)

---

## 6. Job List Table Patterns

### Decision
**Use TanStack Table for job lists with columns for ID, filename/type, status, timestamps, errors, and action buttons.**

### Rationale
Requirements from spec:
- Display: job ID, filename/type, status, start time, completion/error time, error message (if failed)
- Action buttons: retry (for failed imports), download (for completed exports)

TanStack Table is already a dependency (`@tanstack/react-table` v8.21+) and provides:
- Flexible column definitions
- Built-in sorting, filtering
- Type-safe with TypeScript
- Works well with shadcn/ui data-table pattern

### Implementation Pattern

**Column Definition**
```typescript
// Import job table columns
const importColumns: ColumnDef<ImportJob>[] = [
  {
    accessorKey: "id",
    header: "Job ID",
    cell: ({ row }) => <code className="text-xs">{row.getValue("id").slice(0, 8)}</code>,
  },
  {
    accessorKey: "filename",
    header: "File",
  },
  {
    accessorKey: "import_type",
    header: "Type",
    cell: ({ row }) => <Badge>{row.getValue("import_type")}</Badge>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "started_at",
    header: "Started",
    cell: ({ row }) => formatDateTime(row.getValue("started_at")),
  },
  {
    accessorKey: "completed_at",
    header: "Completed",
    cell: ({ row }) => formatDateTime(row.getValue("completed_at")),
  },
  {
    accessorKey: "error_message",
    header: "Error",
    cell: ({ row }) => {
      const error = row.getValue("error_message")
      return error ? <span className="text-destructive text-sm">{error}</span> : "-"
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const job = row.original
      return (
        <div className="flex gap-2">
          {job.status === "failed" && (
            <Button size="sm" variant="outline" onClick={() => handleRetry(job.id)}>
              Retry
            </Button>
          )}
        </div>
      )
    },
  },
]
```

### Alternatives Considered
- **Simple HTML table**: Rejected because less flexible, harder to add features
- **Custom table component**: Rejected because TanStack Table already provides everything needed
- **Data grid library**: Rejected because over-engineering for this use case

### Reference
- **TanStack Table**: Already in `package.json` v8.21.3
- **shadcn/ui table**: `src/components/ui/table.tsx` (existing)
- **Badge component**: `src/components/ui/badge.tsx` (to be added if needed)

---

## 7. Import Retry Mechanism

### Decision
**Implement retry as: show retry button on failed imports → opens upload dialog with new file → creates NEW import job (not PATCH existing).**

### Rationale
The voter-api does **not** provide a PATCH or PUT endpoint to retry failed imports. The only import endpoints are:
- `POST /api/v1/imports/voters` - Create new voter import
- `POST /api/v1/imports/boundaries` - Create new boundary import
- `GET /api/v1/imports/{job_id}` - Get import status

Therefore, "retry" must be implemented as:
1. User clicks "Retry" button on failed import
2. Opens file upload dialog pre-configured with same import type
3. User selects new/corrected file
4. Creates entirely new import job via POST

### Implementation Pattern

```typescript
function ImportJobTable({ jobs }: { jobs: ImportJob[] }) {
  const [retryJob, setRetryJob] = useState<ImportJob | null>(null)

  const handleRetry = (job: ImportJob) => {
    setRetryJob(job)
  }

  return (
    <>
      <Table>
        {/* table columns... */}
        {/* Retry button in actions column for failed jobs */}
      </Table>

      {retryJob && (
        <ImportUploadDialog
          open={!!retryJob}
          onOpenChange={() => setRetryJob(null)}
          importType={retryJob.import_type}
          previousJobId={retryJob.id}
        />
      )}
    </>
  )
}
```

### Alternatives Considered
- **PATCH existing job with new file**: Not available in API
- **Automatic retry with same file**: Rejected because import likely failed due to bad data, needs corrected file
- **No retry, just create new import**: Rejected because spec explicitly requires retry capability

### Reference
- **API spec**: No PATCH/PUT endpoints for imports (verified via OpenAPI spec)

---

## 8. Navigation Structure

### Decision
**Add "Admin" item to main navigation (header/sidebar) with dropdown/submenu for User Management, Imports, Exports.**

### Rationale
Requirements:
- Dedicated "Admin" section in main navigation
- Submenu items: User Management, Imports, Exports
- Visible only to users with admin/analyst roles
- 2-click access to any admin feature (click Admin → click feature)

TanStack Router file-based routing means:
- Routes under `src/routes/admin/` automatically get `/admin` URL path
- Navigation can be added to `src/routes/__root.tsx` (root layout)

### Implementation Pattern

**Root Layout Navigation**
```typescript
// src/routes/__root.tsx (modify existing)
export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { data: user } = useUserRole()
  const isAdmin = user?.role === "admin" || user?.role === "analyst"

  return (
    <div>
      <nav>
        {/* Existing nav items */}

        {isAdmin && (
          <NavigationMenu>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul>
                  <li><Link to="/admin/users">User Management</Link></li>
                  <li><Link to="/admin/imports">Imports</Link></li>
                  <li><Link to="/admin/exports">Exports</Link></li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenu>
        )}
      </nav>
      <Outlet />
    </div>
  )
}
```

### Alternatives Considered
- **Hamburger menu for admin**: Rejected because less discoverable
- **Admin features scattered in relevant sections**: Rejected because spec requires dedicated admin section
- **Direct URL access only**: Rejected because spec requires navigation within 2 clicks

### Reference
- **Root route**: `src/routes/__root.tsx` (to be modified)
- **Navigation**: shadcn/ui navigation-menu component (to be added if needed)
- **Existing nav pattern**: Review current navigation implementation in root layout

---

## Resolved Unknowns

All unknowns from Technical Context have been resolved:

| Unknown | Resolution | Source |
|---------|------------|--------|
| How is user role provided? | Via `GET /api/v1/auth/me` endpoint | OpenAPI spec |
| Import/export job endpoints? | Full set documented (GET/POST for both) | OpenAPI spec |
| Import retry API support? | No PATCH/PUT - retry creates new job | OpenAPI spec |
| Polling pattern? | Use existing `useBatchGeocodeStatus` pattern | Codebase analysis |
| File validation approach? | React Hook Form + Zod + custom validators | Codebase patterns |
| Confirmation dialog component? | shadcn/ui Dialog | Project dependencies |
| Empty state pattern? | Custom EmptyState component | Best practice |
| Job table implementation? | TanStack Table with custom columns | Project dependencies |
| Navigation structure? | Add to root layout with role check | TanStack Router |

---

## Dependencies Required

All dependencies already exist in `package.json`. No new npm packages needed:

- ✅ TanStack Query 5.90+ (polling)
- ✅ TanStack Router 1.159+ (routing)
- ✅ TanStack Table 8.21+ (job tables)
- ✅ React Hook Form 7.71+ (forms)
- ✅ Zod 4.3+ (validation)
- ✅ `ky` 1.14+ (HTTP client)
- ✅ Zustand 5.0+ (state management)
- ✅ Lucide React (icons)

**shadcn/ui components to add** (via `npx shadcn@latest add <component>`):
- `dialog` (confirmation dialogs)
- `badge` (status badges, role badges)
- `data-table` (if not already added - for job tables)
- `navigation-menu` (if not already added - for admin nav dropdown)

---

## Next Steps

1. ✅ Research complete - all unknowns resolved
2. **Proceed to Phase 1**: Generate `data-model.md` and `contracts/admin-api.d.ts`
3. Update agent context with admin feature knowledge
4. Generate task breakdown via `/speckit.tasks`

---

**Research Status**: ✅ Complete
**Date Completed**: 2026-02-14
**Phase 1 Ready**: Yes
