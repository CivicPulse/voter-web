import { useState, useMemo } from "react"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useParticipationStats } from "@/lib/hooks/use-participation-stats"
import { useCountyPrecinctCodes } from "@/lib/hooks/use-county-precinct-codes"
import type { ParticipationStats, PrecinctBreakdownItem } from "@/types/elections"
import { getCountyColor } from "@/types/elections"

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-20 mx-auto" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US")
}

export function ParticipationStatsCard({
  electionId,
}: Readonly<{
  electionId: string
}>) {
  const { data: stats, isLoading, isError, refetch } = useParticipationStats(electionId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Participation Statistics
          {stats?.is_preliminary && (
            <Badge variant="secondary">Preliminary</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <LoadingSkeleton />}

        {isError && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load participation statistics.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !isError && !stats && (
          <p className="text-sm text-muted-foreground py-2">
            No participation data available.
          </p>
        )}

        {!isLoading && !isError && stats && (
          <div className="space-y-6">
            {/* Headline figures */}
            <div className="text-center">
              <p className="text-2xl font-bold" data-testid="total-voted">
                {formatNumber(stats.total_voted)}
              </p>
              <p className="text-sm text-muted-foreground">Votes Cast</p>
            </div>

            {/* County breakdown donut — only shown for multi-county elections */}
            {stats.county_breakdown.length > 1 && (
              <div>
                <h4 className="text-sm font-medium mb-3">By County</h4>
                <div className="flex items-center gap-4">
                  <div className="h-48 w-48 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.county_breakdown}
                          dataKey="count"
                          nameKey="county"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                        >
                          {stats.county_breakdown.map((entry, index) => (
                            <Cell
                              key={entry.county}
                              fill={getCountyColor(index)}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={((value: number, name: string) => [
                            formatNumber(value),
                            name,
                          ]) as never}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5">
                    {stats.county_breakdown.map((entry, index) => (
                      <div
                        key={entry.county}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: getCountyColor(index),
                          }}
                        />
                        <span>
                          {entry.county} — {formatNumber(entry.count)} (
                          {entry.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Precinct breakdown donut — shown when backend provides by_precinct data */}
            {stats.precinct_breakdown && stats.precinct_breakdown.length > 0 && (
              <PrecinctBreakdownChart stats={stats} />
            )}

            {/* Voting method bar chart */}
            {stats.method_breakdown.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Voting Method</h4>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.method_breakdown}
                      layout="vertical"
                      margin={{ left: 100, right: 20, top: 5, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="method"
                        width={90}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={((value: number) => [
                          formatNumber(value),
                          "Votes",
                        ]) as never}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Sub-component: precinct breakdown donut with county filter dropdown */
function PrecinctBreakdownChart({
  stats,
}: Readonly<{
  stats: ParticipationStats
}>) {
  const counties = useMemo(
    () =>
      stats.county_breakdown
        .map((c) => c.county)
        .sort((a, b) => a.localeCompare(b)),
    [stats.county_breakdown],
  )

  // Default to first county in sorted list
  const [selectedCounty, setSelectedCounty] = useState<string | null>(
    counties.length > 0 ? counties[0] : null,
  )

  const { data: precinctCodes, isLoading: isLoadingCodes } =
    useCountyPrecinctCodes(selectedCounty)

  const filteredPrecincts = useMemo(() => {
    const all = stats.precinct_breakdown ?? []
    if (!selectedCounty || !precinctCodes) return all

    const filtered = all.filter((p) => precinctCodes.has(p.precinct))
    // Recalculate percentages relative to filtered county total
    const countyTotal = filtered.reduce((sum, p) => sum + p.count, 0)
    return filtered.map((p) => ({
      ...p,
      percentage: countyTotal > 0 ? (p.count / countyTotal) * 100 : 0,
    }))
  }, [stats.precinct_breakdown, selectedCounty, precinctCodes])

  const displayName = (entry: PrecinctBreakdownItem) =>
    entry.precinct_name ?? entry.precinct

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">By Precinct</h4>
        {counties.length > 1 && (
          <Select
            value={selectedCounty ?? ""}
            onValueChange={(v) => setSelectedCounty(v || null)}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs" data-testid="precinct-county-select">
              <SelectValue placeholder="Select county" />
            </SelectTrigger>
            <SelectContent>
              {counties.map((county) => (
                <SelectItem key={county} value={county}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Loading indicator while fetching boundary codes */}
      {selectedCounty && isLoadingCodes && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Chart + legend */}
      {(counties.length === 1 || (selectedCounty && !isLoadingCodes)) &&
        filteredPrecincts.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="h-48 w-48 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredPrecincts}
                    dataKey="count"
                    nameKey="precinct"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                  >
                    {filteredPrecincts.map((entry, index) => (
                      <Cell
                        key={entry.precinct}
                        fill={getCountyColor(index)}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={((value: number, _name: string, props: { payload: PrecinctBreakdownItem }) => [
                      formatNumber(value),
                      displayName(props.payload),
                    ]) as never}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {filteredPrecincts.map((entry, index) => (
                <div
                  key={entry.precinct}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: getCountyColor(index),
                    }}
                  />
                  <span>
                    {displayName(entry)} — {formatNumber(entry.count)} (
                    {entry.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* No matching precincts for selected county */}
      {selectedCounty && !isLoadingCodes && filteredPrecincts.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No precinct data for {selectedCounty}.
        </p>
      )}
    </div>
  )
}
