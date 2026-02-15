import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useElectionFilters } from "@/lib/hooks/use-election-filters"
import { categorizeRace } from "@/types/elections"
import type { Election, RaceCategory } from "@/types/elections"
import { RaceListItem } from "./race-list-item"

interface RaceListProps {
  races: Election[]
  electionDate: string
}

const CATEGORY_LABELS: Record<RaceCategory, string> = {
  all: "All Categories",
  federal: "Federal",
  state_senate: "State Senate",
  state_house: "State House",
  local: "Local",
}

export function RaceList({ races, electionDate }: RaceListProps) {
  const { raceFilters, setRaceFilters } = useElectionFilters()

  const filtered = races.filter((race) => {
    if (raceFilters.search) {
      const query = raceFilters.search.toLowerCase()
      const matchesName = race.name.toLowerCase().includes(query)
      const matchesDistrict = race.district.toLowerCase().includes(query)
      if (!matchesName && !matchesDistrict) return false
    }

    if (raceFilters.category !== "all") {
      if (categorizeRace(race.district) !== raceFilters.category) return false
    }

    return true
  })

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search races..."
            value={raceFilters.search}
            onChange={(e) => setRaceFilters({ search: e.target.value })}
            className="pl-9"
          />
        </div>
        <Select
          value={raceFilters.category}
          onValueChange={(v) =>
            setRaceFilters({ category: v as RaceCategory })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {races.length === 0
              ? "No races found for this date."
              : "No races match the current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((race) => (
            <RaceListItem
              key={race.id}
              race={race}
              electionDate={electionDate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
