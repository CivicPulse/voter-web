import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { GeocodingProvider } from "@/types/lookup"

interface GeocodingJobFiltersProps {
  statusFilter: string
  providerFilter: string
  countyFilter: string
  providers: GeocodingProvider[] | undefined
  onStatusChange: (value: string) => void
  onProviderChange: (value: string) => void
  onCountyChange: (value: string) => void
}

export function GeocodingJobFilters({
  statusFilter,
  providerFilter,
  countyFilter,
  providers,
  onStatusChange,
  onProviderChange,
  onCountyChange,
}: GeocodingJobFiltersProps) {
  const uniqueProviders = providers?.map((p) => p.name) ?? []

  return (
    <div className="flex items-center gap-3">
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="running">Running</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={providerFilter} onValueChange={onProviderChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All providers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All providers</SelectItem>
          {uniqueProviders.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Filter by county..."
        value={countyFilter}
        onChange={(e) => onCountyChange(e.target.value)}
        className="w-[200px]"
      />
    </div>
  )
}
