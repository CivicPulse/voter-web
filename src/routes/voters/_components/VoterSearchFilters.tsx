import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useVoterFilters } from "@/hooks/useVoters"
import type { VoterSearchParams } from "@/types/voter"

interface VoterSearchFiltersProps {
  params: VoterSearchParams
}

export function VoterSearchFilters({ params }: VoterSearchFiltersProps) {
  const navigate = useNavigate()
  const { data: filters } = useVoterFilters()
  const [searchInput, setSearchInput] = useState(params.q ?? "")

  // Debounced search — update URL after 300ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim()
      if (trimmed !== (params.q ?? "")) {
        navigate({
          to: "/voters",
          search: {
            ...params,
            q: trimmed || undefined,
            page: 1,
          },
          replace: true,
        })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, params, navigate])

  const updateFilter = (updates: Partial<VoterSearchParams>) => {
    navigate({
      to: "/voters",
      search: {
        ...params,
        ...updates,
        page: 1,
      },
      replace: true,
    })
  }

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search voters by name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
          aria-label="Search voters"
        />
      </div>

      <Select
        value={params.county ?? "all"}
        onValueChange={(v) =>
          updateFilter({ county: v === "all" ? undefined : v })
        }
      >
        <SelectTrigger className="w-[160px]" aria-label="Filter by county">
          <SelectValue placeholder="County" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Counties</SelectItem>
          {filters?.counties.map((county) => (
            <SelectItem key={county} value={county}>
              {county}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.status ?? "all"}
        onValueChange={(v) =>
          updateFilter({ status: v === "all" ? undefined : v })
        }
      >
        <SelectTrigger className="w-[140px]" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {filters?.statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.congressional_district ?? "all"}
        onValueChange={(v) =>
          updateFilter({
            congressional_district: v === "all" ? undefined : v,
          })
        }
      >
        <SelectTrigger className="w-[180px]" aria-label="Filter by congressional district">
          <SelectValue placeholder="Congressional" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Congressional</SelectItem>
          {filters?.congressional_districts.map((d) => (
            <SelectItem key={d} value={d}>
              District {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.state_senate_district ?? "all"}
        onValueChange={(v) =>
          updateFilter({
            state_senate_district: v === "all" ? undefined : v,
          })
        }
      >
        <SelectTrigger className="w-[160px]" aria-label="Filter by state senate district">
          <SelectValue placeholder="State Senate" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All State Senate</SelectItem>
          {filters?.state_senate_districts.map((d) => (
            <SelectItem key={d} value={d}>
              District {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.state_house_district ?? "all"}
        onValueChange={(v) =>
          updateFilter({
            state_house_district: v === "all" ? undefined : v,
          })
        }
      >
        <SelectTrigger className="w-[150px]" aria-label="Filter by state house district">
          <SelectValue placeholder="State House" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All State House</SelectItem>
          {filters?.state_house_districts.map((d) => (
            <SelectItem key={d} value={d}>
              District {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
