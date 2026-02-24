import { useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { History, AlertCircle, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useVoterHistory } from "@/hooks/useVoters"
import type { VoterParticipationRecord } from "@/types/voter"
import type { ElectionType } from "@/types/elections"

const ELECTION_TYPE_LABELS: Record<ElectionType, string> = {
  general: "General",
  primary: "Primary",
  special: "Special",
  runoff: "Runoff",
}

function ElectionTypeBadge({ type }: { type: ElectionType }) {
  const variantMap: Record<ElectionType, "default" | "secondary" | "outline"> = {
    general: "default",
    primary: "secondary",
    special: "outline",
    runoff: "outline",
  }
  return <Badge variant={variantMap[type]}>{ELECTION_TYPE_LABELS[type]}</Badge>
}

function filterRecords(
  records: VoterParticipationRecord[],
  typeFilter: ElectionType | "all",
  dateFrom: string,
  dateTo: string,
): VoterParticipationRecord[] {
  return records.filter((r) => {
    if (typeFilter !== "all" && r.election_type !== typeFilter) return false
    if (dateFrom && r.election_date < dateFrom) return false
    if (dateTo && r.election_date > dateTo) return false
    return true
  })
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

export function VoterHistoryCard({
  voterRegistrationNumber,
}: Readonly<{
  voterRegistrationNumber: string
}>) {
  const { data: history, isLoading, isError, refetch } = useVoterHistory(voterRegistrationNumber)

  const [typeFilter, setTypeFilter] = useState<ElectionType | "all">("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filtered = useMemo(() => {
    if (!history) return []
    return filterRecords(history, typeFilter, dateFrom, dateTo)
  }, [history, typeFilter, dateFrom, dateTo])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Election History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <LoadingSkeleton />}

        {isError && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load election history.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !isError && history && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as ElectionType | "all")}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Election type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                  <SelectItem value="runoff">Runoff</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="date"
                aria-label="Date from"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="date"
                aria-label="Date to"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {history.length === 0
                  ? "No election history found for this voter."
                  : "No elections match the current filters."}
              </p>
            ) : (
              <div className="divide-y">
                {filtered.map((record) => {
                  const key = record.election_id ?? `${record.election_date}-${record.election_name}`
                  const content = (
                    <>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">
                          {record.election_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.election_date + "T00:00:00").toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" },
                          )}{" "}
                          · {record.voting_method}
                        </p>
                      </div>
                      <ElectionTypeBadge type={record.election_type} />
                    </>
                  )

                  if (record.election_id) {
                    return (
                      <Link
                        key={key}
                        to="/elections/$electionDate/$electionId"
                        params={{
                          electionDate: record.election_date,
                          electionId: record.election_id,
                        }}
                        search={{ tab: "results" }}
                        className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                      >
                        {content}
                      </Link>
                    )
                  }

                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between py-3 -mx-2 px-2"
                    >
                      {content}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
