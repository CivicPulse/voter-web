import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronUp, Layers, Loader2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface LayerBarProps {
  boundaryTypes: string[] | undefined
  isTypesLoading: boolean
  selectedType: string | null
  onTypeChange: (type: string | undefined) => void
  overlayFeatureCount: number | null
  countyName: string
}

export function LayerBar({
  boundaryTypes,
  isTypesLoading,
  selectedType,
  onTypeChange,
  overlayFeatureCount,
  countyName,
}: LayerBarProps) {
  const [expanded, setExpanded] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  // Close mobile layer menu when tapping outside (e.g. map)
  useEffect(() => {
    if (!expanded) return
    function handleClickOutside(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [expanded])

  const statusText =
    selectedType && overlayFeatureCount !== null
      ? overlayFeatureCount > 0
        ? `Showing ${overlayFeatureCount} ${selectedType.replaceAll("_", " ")} district${overlayFeatureCount === 1 ? "" : "s"} intersecting ${countyName} County`
        : `No ${selectedType.replaceAll("_", " ")} districts found intersecting ${countyName} County`
      : null

  const toggleButtons = boundaryTypes?.map((type) => (
    <ToggleGroupItem
      key={type}
      value={type}
      className="text-xs capitalize bg-neutral-300 hover:bg-neutral-700 hover:text-white data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
    >
      {type.replaceAll("_", " ")}
    </ToggleGroupItem>
  ))

  const clearButton = selectedType && (
    <Button
      variant="outline"
      size="sm"
      className="text-xs bg-neutral-300 hover:bg-neutral-700 hover:text-white"
      onClick={() => onTypeChange(undefined)}
    >
      <X className="h-3 w-3" />
      Clear
    </Button>
  )

  if (isTypesLoading) {
    return (
      <div className="border-b bg-background px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading layers…</span>
      </div>
    )
  }

  if (!boundaryTypes || boundaryTypes.length === 0) {
    return null
  }

  return (
    <div className="border-b bg-background px-4 py-2">
      {/* Desktop: horizontal row */}
      <div className="hidden md:flex items-center gap-2">
        <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={selectedType ?? ""}
          onValueChange={(value) =>
            onTypeChange(value === "" ? undefined : value)
          }
          className="flex flex-wrap justify-start gap-2"
        >
          {toggleButtons}
        </ToggleGroup>
        {clearButton}
        {statusText && (
          <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
            {statusText}
          </span>
        )}
      </div>

      {/* Mobile: collapsible */}
      <div className="md:hidden" ref={barRef}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-2 text-sm font-medium"
        >
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span>Layers</span>
          {selectedType && (
            <Badge variant="secondary" className="text-xs capitalize">
              {selectedType.replaceAll("_", " ")}
            </Badge>
          )}
          {expanded ? (
            <ChevronUp className="ml-auto h-4 w-4" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4" />
          )}
        </button>
        {expanded && (
          <div className="mt-2 space-y-2">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={selectedType ?? ""}
              onValueChange={(value) => {
                onTypeChange(value === "" ? undefined : value)
                setExpanded(false)
              }}
              className="flex flex-wrap justify-start gap-2"
            >
              {toggleButtons}
            </ToggleGroup>
            {selectedType && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-neutral-300 hover:bg-neutral-700 hover:text-white"
                onClick={() => {
                  onTypeChange(undefined)
                  setExpanded(false)
                }}
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
            {statusText && (
              <p className="text-xs text-muted-foreground">{statusText}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
