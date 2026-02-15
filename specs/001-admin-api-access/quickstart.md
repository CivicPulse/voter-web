# Quickstart Guide: Admin Feature Development

**Feature**: Admin API Access
**Date**: 2026-02-14
**For**: Developers implementing admin UI components

---

## Overview

This guide provides quick-start patterns for implementing admin features following the established architecture. All examples use TypeScript strict mode, TanStack Router/Query, and shadcn/ui components.

---

## Table of Contents

1. [Adding a New Admin Route](#1-adding-a-new-admin-route)
2. [Implementing Role-Based Access](#2-implementing-role-based-access)
3. [Creating a Job Status Page with Polling](#3-creating-a-job-status-page-with-polling)
4. [File Upload with Validation](#4-file-upload-with-validation)
5. [Confirmation Dialogs](#5-confirmation-dialogs)
6. [Empty States](#6-empty-states)
7. [Job Tables with Actions](#7-job-tables-with-actions)
8. [API Client Functions](#8-api-client-functions)

---

## 1. Adding a New Admin Route

**File**: `src/routes/admin/my-feature/index.tsx`

```typescript
import { createFileRoute } from "@tanstack/react-router"
import { useUserRole } from "@/lib/hooks/use-user-role"

export const Route = createFileRoute("/admin/my-feature/")({
  component: MyFeaturePage,
  // Optional: Add route-level permission check
  beforeLoad: async ({ context }) => {
    const userRole = context.auth?.userRole
    if (!userRole || (userRole !== "admin" && userRole !== "analyst")) {
      throw redirect({ to: "/", replace: true })
    }
  },
})

function MyFeaturePage() {
  const { data: user, isLoading } = useUserRole()

  if (isLoading) {
    return <PageSkeleton />
  }

  if (!user || (user.role !== "admin" && user.role !== "analyst")) {
    return <AccessDenied />
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Admin Feature</h1>
      {/* Your component content */}
    </div>
  )
}
```

**Key Points**:
- Use `createFileRoute()` from TanStack Router
- File path determines URL: `admin/my-feature/index.tsx` → `/admin/my-feature`
- Implement role check in `beforeLoad` for route-level protection
- Component-level role check for UI protection

---

## 2. Implementing Role-Based Access

### Fetch User Role Hook

**File**: `src/lib/hooks/use-user-role.ts`

```typescript
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/stores/auth-store"
import { getCurrentUser } from "@/lib/api/admin"

export function useUserRole() {
  const { accessToken, setUserRole } = useAuthStore()

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const user = await getCurrentUser()
      setUserRole(user.role)
      return user
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!accessToken,
    retry: 1,
  })
}
```

### Conditional Navigation Item

**File**: `src/routes/__root.tsx`

```typescript
function RootLayout() {
  const { data: user } = useUserRole()
  const isAdmin = user?.role === "admin" || user?.role === "analyst"

  return (
    <div>
      <nav className="border-b">
        <div className="container mx-auto flex items-center gap-6 p-4">
          <Link to="/">Home</Link>
          {/* Other nav items */}

          {isAdmin && (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-48 p-2">
                      <li>
                        <Link
                          to="/admin/users"
                          className="block px-4 py-2 hover:bg-accent rounded"
                        >
                          User Management
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/admin/imports"
                          className="block px-4 py-2 hover:bg-accent rounded"
                        >
                          Imports
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/admin/exports"
                          className="block px-4 py-2 hover:bg-accent rounded"
                        >
                          Exports
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>
      </nav>
      <Outlet />
    </div>
  )
}
```

---

## 3. Creating a Job Status Page with Polling

**File**: `src/lib/hooks/use-import-jobs.ts`

```typescript
import { useQuery } from "@tanstack/react-query"
import { getImportJobs } from "@/lib/api/admin"
import { isActiveJob } from "@/types/admin"
import type { ImportJob } from "@/types/admin"

export function useImportJobs() {
  return useQuery({
    queryKey: ["admin", "imports", "list"],
    queryFn: getImportJobs,
    refetchInterval: (query) => {
      const jobs = query.state.data?.jobs || []
      // Continue polling if any job is active
      const hasActiveJobs = jobs.some(isActiveJob)
      return hasActiveJobs ? 3000 : false
    },
    staleTime: 0,
    retry: 2,
  })
}

export function useImportJob(jobId: string | null) {
  return useQuery({
    queryKey: ["admin", "imports", jobId],
    queryFn: () => getImportJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data
      return isActiveJob(job) ? 3000 : false
    },
    staleTime: 0,
    retry: 2,
  })
}
```

**Component Usage**:

```typescript
function ImportsPage() {
  const { data, isLoading, error } = useImportJobs()

  if (isLoading) return <Skeleton />
  if (error) return <ErrorAlert error={error} />
  if (!data || data.jobs.length === 0) {
    return <EmptyState /* ... */ />
  }

  return <ImportJobTable jobs={data.jobs} />
}
```

---

## 4. File Upload with Validation

**File**: `src/lib/utils/file-validation.ts`

```typescript
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export const VOTER_FILE_TYPES = ["text/csv", ".csv"]
export const BOUNDARY_FILE_TYPES = [
  "application/geo+json",
  ".geojson",
  ".json",
  "application/zip",
  ".zip",
]

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.startsWith(".")) {
      return file.name.toLowerCase().endsWith(type)
    }
    return file.type === type
  })
}

export function validateFileSize(
  file: File,
  maxSize: number = MAX_FILE_SIZE
): boolean {
  return file.size <= maxSize
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
}
```

**Zod Schema**:

```typescript
import { z } from "zod"
import {
  validateFileSize,
  validateFileType,
  VOTER_FILE_TYPES,
} from "@/lib/utils/file-validation"

export const voterImportSchema = z.object({
  file: z
    .instanceof(File)
    .refine(validateFileSize, "File must be less than 100MB")
    .refine(
      (file) => validateFileType(file, VOTER_FILE_TYPES),
      "File must be CSV format"
    ),
})

export type VoterImportFormValues = z.infer<typeof voterImportSchema>
```

**Form Component**:

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { voterImportSchema } from "@/lib/schemas/import-form"

function VoterImportForm() {
  const form = useForm<VoterImportFormValues>({
    resolver: zodResolver(voterImportSchema),
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate immediately
    form.setValue("file", file)
    form.trigger("file").then((isValid) => {
      if (isValid) {
        setSelectedFile(file)
      }
    })
  }

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="file"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Voter CSV File</FormLabel>
            <FormControl>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
            </FormControl>
            <FormDescription>
              Upload a CSV file (max 100MB)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  )
}
```

---

## 5. Confirmation Dialogs

**Pattern**: File upload → Validation → Confirmation → Submit

```typescript
function ImportUploadDialog({ open, onOpenChange }: DialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleFileSelect = (file: File) => {
    // Validate first
    if (!validateFileSize(file) || !validateFileType(file, VOTER_FILE_TYPES)) {
      toast.error("Invalid file. Must be CSV under 100MB.")
      return
    }

    setSelectedFile(file)
    setShowConfirm(true)
  }

  const uploadMutation = useMutation({
    mutationFn: uploadVoterImport,
    onSuccess: () => {
      toast.success("Import started successfully")
      setShowConfirm(false)
      setSelectedFile(null)
      onOpenChange(false)
    },
  })

  return (
    <>
      {/* File selection dialog */}
      <Dialog open={open && !showConfirm} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Voter Import</DialogTitle>
          </DialogHeader>
          <Input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p><strong>File:</strong> {selectedFile?.name}</p>
            <p><strong>Size:</strong> {formatFileSize(selectedFile?.size || 0)}</p>
            <p><strong>Type:</strong> Voter Import</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => uploadMutation.mutate(selectedFile!)}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading..." : "Confirm Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

---

## 6. Empty States

**Component**: `src/components/ui/empty-state.tsx`

```typescript
import { Button } from "@/components/ui/button"

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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-muted-foreground">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 text-sm text-muted-foreground max-w-md">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
```

**Usage**:

```typescript
import { Users } from "lucide-react"

function UserListPage() {
  const { data } = useAdminUsers()

  if (!data || data.users.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="No users yet"
        description="Create your first user to get started with user management."
        action={{
          label: "Create User",
          onClick: () => navigate("/admin/users/create"),
        }}
      />
    )
  }

  return <UserTable users={data.users} />
}
```

---

## 7. Job Tables with Actions

**Using TanStack Table**:

```typescript
import { type ColumnDef } from "@tanstack/react-table"
import { type ImportJob, isFailedImport } from "@/types/admin"
import { DataTable } from "@/components/ui/data-table"

const importColumns: ColumnDef<ImportJob>[] = [
  {
    accessorKey: "id",
    header: "Job ID",
    cell: ({ row }) => (
      <code className="text-xs">{row.getValue("id").slice(0, 8)}</code>
    ),
  },
  {
    accessorKey: "filename",
    header: "File",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variant =
        status === "completed"
          ? "success"
          : status === "failed"
          ? "destructive"
          : status === "processing"
          ? "default"
          : "secondary"

      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: "started_at",
    header: "Started",
    cell: ({ row }) => formatDateTime(row.getValue("started_at")),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const job = row.original

      return (
        <div className="flex gap-2">
          {isFailedImport(job) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRetry(job)}
            >
              Retry
            </Button>
          )}
        </div>
      )
    },
  },
]

function ImportJobTable({ jobs }: { jobs: ImportJob[] }) {
  return <DataTable columns={importColumns} data={jobs} />
}
```

---

## 8. API Client Functions

**File**: `src/lib/api/admin.ts`

```typescript
import { client } from "./client"
import type {
  AdminUser,
  CreateUserRequest,
  UserListResponse,
  ImportJob,
  ExportJob,
} from "@/types/admin"

// User Management
export async function getCurrentUser(): Promise<AdminUser> {
  return client.get("auth/me").json<AdminUser>()
}

export async function getAdminUsers(): Promise<UserListResponse> {
  return client.get("users").json<UserListResponse>()
}

export async function createUser(
  data: CreateUserRequest
): Promise<AdminUser> {
  return client.post("users", { json: data }).json<AdminUser>()
}

// Import Operations
export async function getImportJobs(): Promise<{ jobs: ImportJob[] }> {
  return client.get("imports").json<{ jobs: ImportJob[] }>()
}

export async function getImportJob(jobId: string): Promise<ImportJob> {
  return client.get(`imports/${jobId}`).json<ImportJob>()
}

export async function uploadVoterImport(file: File): Promise<ImportJob> {
  const formData = new FormData()
  formData.append("file", file)

  return client
    .post("imports/voters", { body: formData })
    .json<ImportJob>()
}

export async function uploadBoundaryImport(file: File): Promise<ImportJob> {
  const formData = new FormData()
  formData.append("file", file)

  return client
    .post("imports/boundaries", { body: formData })
    .json<ImportJob>()
}

// Export Operations
export async function getExportJobs(): Promise<{ jobs: ExportJob[] }> {
  return client.get("exports").json<{ jobs: ExportJob[] }>()
}

export async function createExport(exportType: string): Promise<ExportJob> {
  return client
    .post("exports", { json: { export_type: exportType } })
    .json<ExportJob>()
}

export async function downloadExport(jobId: string): Promise<Blob> {
  return client.get(`exports/${jobId}/download`).blob()
}
```

---

## Common Patterns Summary

| Pattern | File Location | Key Dependencies |
|---------|--------------|------------------|
| **Route** | `src/routes/admin/*/index.tsx` | TanStack Router |
| **Role Check** | `src/lib/hooks/use-user-role.ts` | TanStack Query, Zustand |
| **Job Polling** | `src/lib/hooks/use-*-jobs.ts` | TanStack Query |
| **File Validation** | `src/lib/utils/file-validation.ts` | Zod, React Hook Form |
| **Confirmation** | Component with nested Dialogs | shadcn/ui Dialog |
| **Empty State** | `src/components/ui/empty-state.tsx` | shadcn/ui Button |
| **Job Table** | Component with `ColumnDef<T>[]` | TanStack Table |
| **API Client** | `src/lib/api/admin.ts` | ky HTTP client |

---

## Testing Checklist

Before marking implementation complete:

- [ ] **Role-based access**: Verify admin nav hidden for non-admin users
- [ ] **Route protection**: Verify redirect on unauthorized access attempts
- [ ] **File validation**: Test with oversized files (>100MB), wrong type
- [ ] **Confirmation dialogs**: Test cancel flow, confirm flow
- [ ] **Empty states**: Verify shown when no data, action button works
- [ ] **Job polling**: Verify starts for active jobs, stops for completed/failed
- [ ] **Error handling**: Test with network errors, 401/403 responses
- [ ] **Form validation**: Test all validation rules, error messages
- [ ] **UI verification**: Use Playwright MCP tools for visual checks

---

## Next Steps

1. **Implement routes** following file-based routing pattern
2. **Create hooks** for data fetching with polling
3. **Build components** using shadcn/ui + TanStack libraries
4. **Write tests** targeting 95% coverage
5. **Visual verification** with Playwright before PR

---

**Quickstart Status**: ✅ Complete
**Ready for Implementation**: Yes
**Refer to**: `data-model.md`, `research.md`, `src/types/admin.ts`
