import { AlertCircle, RefreshCw } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useParticipationStats } from "@/lib/hooks/use-participation-stats"
import { getCountyColor } from "@/types/elections"

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center space-y-2">
            <Skeleton className="h-8 w-20 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        ))}
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
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold" data-testid="total-eligible">
                  {formatNumber(stats.total_eligible)}
                </p>
                <p className="text-sm text-muted-foreground">Eligible Voters</p>
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="total-voted">
                  {formatNumber(stats.total_voted)}
                </p>
                <p className="text-sm text-muted-foreground">Votes Cast</p>
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="turnout-percentage">
                  {stats.total_eligible === 0
                    ? "N/A"
                    : `${stats.turnout_percentage.toFixed(1)}%`}
                </p>
                <p className="text-sm text-muted-foreground">Turnout</p>
              </div>
            </div>

            {/* Party affiliation donut chart */}
            {stats.party_breakdown.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">By County</h4>
                <div className="flex items-center gap-4">
                  <div className="h-48 w-48 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.party_breakdown}
                          dataKey="count"
                          nameKey="party"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                        >
                          {stats.party_breakdown.map((entry, index) => (
                            <Cell
                              key={entry.party}
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
                    {stats.party_breakdown.map((entry, index) => (
                      <div
                        key={entry.party}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: getCountyColor(index),
                          }}
                        />
                        <span>
                          {entry.party} — {formatNumber(entry.count)} (
                          {entry.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
