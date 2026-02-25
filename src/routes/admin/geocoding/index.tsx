import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminErrorBoundary } from "@/components/admin-error-boundary"
import {
  useCacheStats,
  useGeocodingJobs,
  useGeocodingProviders,
} from "@/hooks/useAddressLookup"
import { isActiveGeocodingJob } from "@/types/lookup"
import { JobProgressCard } from "./_components/job-progress-card"
import { TriggerGeocodeDialog } from "./_components/trigger-geocode-dialog"
import { CacheStatsGrid } from "./_components/cache-stats-grid"
import { ProviderList } from "./_components/provider-list"
import { GeocodingJobTable } from "./_components/geocoding-job-table"
import { GeocodingJobFilters } from "./_components/geocoding-job-filters"

export const Route = createFileRoute("/admin/geocoding/")({
  component: () => (
    <AdminErrorBoundary>
      <GeocodingPage />
    </AdminErrorBoundary>
  ),
})

function GeocodingPage() {
  const [showTriggerDialog, setShowTriggerDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [providerFilter, setProviderFilter] = useState("all")
  const [countyFilter, setCountyFilter] = useState("")
  const [debouncedCounty, setDebouncedCounty] = useState("")
  const [page, setPage] = useState(1)
  const countyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    countyTimerRef.current = setTimeout(
      () => setDebouncedCounty(countyFilter),
      300,
    )
    return () => clearTimeout(countyTimerRef.current)
  }, [countyFilter])

  const filters = {
    job_status: statusFilter !== "all" ? statusFilter : undefined,
    provider: providerFilter !== "all" ? providerFilter : undefined,
    county: debouncedCounty.trim() || undefined,
    page,
    page_size: 20,
  }

  // Separate unfiltered query to reliably detect active jobs regardless of
  // table filters or pagination. Drives the progress card and button state.
  const { data: activeJobsData } = useGeocodingJobs({
    job_status: "running",
    page: 1,
    page_size: 1,
  })
  const { data: pendingJobsData } = useGeocodingJobs({
    job_status: "pending",
    page: 1,
    page_size: 1,
  })

  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
  } = useGeocodingJobs(filters)
  const {
    data: cacheStats,
    isLoading: cacheLoading,
    error: cacheError,
  } = useCacheStats()
  const {
    data: providersData,
    isLoading: providersLoading,
    error: providersError,
  } = useGeocodingProviders()

  const jobs = jobsData?.items ?? []
  const pagination = jobsData?.pagination
  const activeJob =
    (activeJobsData?.items ?? []).find(isActiveGeocodingJob) ??
    (pendingJobsData?.items ?? []).find(isActiveGeocodingJob)
  const hasActiveJobs = activeJob !== undefined

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handleProviderChange = (value: string) => {
    setProviderFilter(value)
    setPage(1)
  }

  const handleCountyChange = (value: string) => {
    setCountyFilter(value)
    setPage(1)
  }

  const handleJobStarted = () => {
    setStatusFilter("all")
    setProviderFilter("all")
    setCountyFilter("")
    setDebouncedCounty("")
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Batch Geocoding</h1>
          <p className="text-muted-foreground">
            Geocode voter addresses, monitor jobs, and view cache statistics
          </p>
        </div>
        <Button
          onClick={() => setShowTriggerDialog(true)}
          disabled={hasActiveJobs}
        >
          <Globe className="h-4 w-4 mr-2" />
          Start Batch Geocode
        </Button>
      </div>

      {/* Active Job */}
      {activeJob && <JobProgressCard job={activeJob} />}

      {/* Job History */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Job History</h2>
        <GeocodingJobFilters
          statusFilter={statusFilter}
          providerFilter={providerFilter}
          countyFilter={countyFilter}
          providers={providersData?.providers}
          onStatusChange={handleStatusChange}
          onProviderChange={handleProviderChange}
          onCountyChange={handleCountyChange}
        />
        {jobsLoading ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : jobsError ? (
          <div className="border border-destructive rounded-lg p-4">
            <p className="text-sm text-destructive">
              Failed to load jobs: {jobsError.message}
            </p>
          </div>
        ) : (
          <>
            <GeocodingJobTable jobs={jobs} />
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.total_pages} ({pagination.total} total jobs)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= pagination.total_pages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cache Statistics */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Cache Statistics</h2>
        {cacheLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : cacheError ? (
          <div className="border border-destructive rounded-lg p-4">
            <p className="text-sm text-destructive">
              Failed to load cache statistics: {cacheError.message}
            </p>
          </div>
        ) : (
          cacheStats && <CacheStatsGrid stats={cacheStats} />
        )}
      </div>

      {/* Providers */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Providers</h2>
        {providersLoading ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : providersError ? (
          <div className="border border-destructive rounded-lg p-4">
            <p className="text-sm text-destructive">
              Failed to load providers: {providersError.message}
            </p>
          </div>
        ) : (
          providersData && <ProviderList data={providersData} />
        )}
      </div>

      {/* Trigger Dialog */}
      <TriggerGeocodeDialog
        open={showTriggerDialog}
        onOpenChange={setShowTriggerDialog}
        onJobStarted={handleJobStarted}
        providers={providersData?.providers}
      />
    </div>
  )
}
