import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CacheStats } from "@/types/lookup"

interface CacheStatsGridProps {
  stats: CacheStats
}

export function CacheStatsGrid({ stats }: CacheStatsGridProps) {
  if (stats.providers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No geocode cache data available.
      </p>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.providers.map((entry) => (
        <Card key={entry.provider}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base capitalize">
              {entry.provider}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cached entries</span>
              <span className="font-medium">
                {entry.cached_count.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Earliest</span>
              <span className="font-medium">
                {new Date(entry.oldest_entry).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latest</span>
              <span className="font-medium">
                {new Date(entry.newest_entry).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
