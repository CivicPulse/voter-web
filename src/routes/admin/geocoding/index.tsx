import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminErrorBoundary } from "@/components/admin-error-boundary"
import {
  useBatchGeocodeStatus,
  useCacheStats,
  useGeocodingProviders,
} from "@/hooks/useAddressLookup"
import { JobProgressCard } from "./_components/job-progress-card"
import { TriggerGeocodeDialog } from "./_components/trigger-geocode-dialog"
import { CacheStatsGrid } from "./_components/cache-stats-grid"
import { ProviderList } from "./_components/provider-list"

export const Route = createFileRoute("/admin/geocoding/")({
  component: () => (
    <AdminErrorBoundary>
      <GeocodingPage />
    </AdminErrorBoundary>
  ),
})

function GeocodingPage() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [showTriggerDialog, setShowTriggerDialog] = useState(false)

  const { data: jobStatus } = useBatchGeocodeStatus(activeJobId)
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

  const isJobActive =
    jobStatus?.status === "pending" || jobStatus?.status === "running"

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
          disabled={isJobActive}
        >
          <Globe className="h-4 w-4 mr-2" />
          Start Batch Geocode
        </Button>
      </div>

      {/* Active Job */}
      {jobStatus && <JobProgressCard job={jobStatus} />}

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
        onJobStarted={setActiveJobId}
        providers={providersData?.providers}
      />
    </div>
  )
}
