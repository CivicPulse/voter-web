import { Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Election } from "@/types/elections"

interface ElectionKeyDatesProps {
  election: Election
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", DATE_FORMAT)
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  // Omit year on start if same year
  if (startDate.getFullYear() === endDate.getFullYear()) {
    const startStr = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    const endStr = endDate.toLocaleDateString("en-US", DATE_FORMAT)
    return `${startStr} – ${endStr}`
  }
  return `${formatDate(start)} – ${formatDate(end)}`
}

function isWithin30Days(iso: string): boolean {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= 30
}

interface DateRowProps {
  label: string
  value: string
  highlight: boolean
}

function DateRow({ label, value, highlight }: DateRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", highlight && "text-blue-600 dark:text-blue-400")}>
        {value}
      </span>
    </div>
  )
}

export function ElectionKeyDates({ election }: ElectionKeyDatesProps) {
  const hasAnyDate =
    election.registration_deadline ||
    election.early_voting_start ||
    election.early_voting_end ||
    election.absentee_request_deadline ||
    election.qualifying_start ||
    election.qualifying_end

  if (!hasAnyDate) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Key Dates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {election.registration_deadline && (
            <DateRow
              label="Registration Deadline"
              value={formatDate(election.registration_deadline)}
              highlight={isWithin30Days(election.registration_deadline)}
            />
          )}

          {election.early_voting_start && election.early_voting_end && (
            <DateRow
              label="Early Voting"
              value={formatDateRange(
                election.early_voting_start,
                election.early_voting_end,
              )}
              highlight={
                isWithin30Days(election.early_voting_start) ||
                isWithin30Days(election.early_voting_end)
              }
            />
          )}

          {election.absentee_request_deadline && (
            <DateRow
              label="Absentee Request Deadline"
              value={formatDate(election.absentee_request_deadline)}
              highlight={isWithin30Days(election.absentee_request_deadline)}
            />
          )}

          {election.qualifying_start && election.qualifying_end && (
            <DateRow
              label="Qualifying Period"
              value={formatDateRange(
                election.qualifying_start,
                election.qualifying_end,
              )}
              highlight={
                isWithin30Days(election.qualifying_start) ||
                isWithin30Days(election.qualifying_end)
              }
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
