import { useState, useCallback } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBoundaries, useBoundaryTypes } from "@/lib/hooks/use-boundaries"
import type { BoundaryListItem } from "@/types/boundary"

interface BoundarySelectorProps {
  value: string | null
  district: string
  onChange: (boundaryId: string | null, districtName: string) => void
}

export function BoundarySelector({ value, district, onChange }: BoundarySelectorProps) {
  const [open, setOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [search, setSearch] = useState("")

  const { data: types = [] } = useBoundaryTypes()
  const { data: boundariesData, isFetching } = useBoundaries({
    type: typeFilter || undefined,
    search: search || undefined,
  })
  const boundaries = boundariesData?.items ?? []

  const selectedBoundary = value
    ? boundaries.find((b) => b.id === value) ?? null
    : null

  const handleSelect = useCallback(
    (boundary: BoundaryListItem) => {
      onChange(boundary.id, boundary.name)
      setOpen(false)
    },
    [onChange],
  )

  const handleClear = useCallback(() => {
    onChange(null, "")
    setTypeFilter("")
    setSearch("")
  }, [onChange])

  const formatBoundaryLabel = (b: BoundaryListItem) =>
    `${b.boundary_type} — ${b.boundary_identifier}${b.county ? ` (${b.county})` : ""}`

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Boundary Type</Label>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Select boundary type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value && selectedBoundary ? (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
          <span className="flex-1 text-sm font-medium">{selectedBoundary.name}</span>
          <span className="text-xs text-muted-foreground">{formatBoundaryLabel(selectedBoundary)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleClear}
            aria-label="Clear boundary selection"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : typeFilter ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              Select a boundary...
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command>
              <CommandInput
                placeholder="Search boundaries..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                {isFetching ? (
                  <CommandEmpty>Loading...</CommandEmpty>
                ) : boundaries.length === 0 ? (
                  <CommandEmpty>No boundaries found.</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {boundaries.map((boundary) => (
                      <CommandItem
                        key={boundary.id}
                        value={boundary.id}
                        onSelect={() => handleSelect(boundary)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === boundary.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{boundary.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatBoundaryLabel(boundary)}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="space-y-1.5">
          <Label>District (manual entry)</Label>
          <Input
            placeholder="Enter district name..."
            value={district}
            onChange={(e) => onChange(null, e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
