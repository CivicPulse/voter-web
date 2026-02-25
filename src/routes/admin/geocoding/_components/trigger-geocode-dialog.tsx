import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBatchGeocode } from "@/hooks/useAddressLookup"
import type { GeocodingProvider } from "@/types/lookup"

interface TriggerGeocodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJobStarted: () => void
  providers: GeocodingProvider[] | undefined
}

export function TriggerGeocodeDialog({
  open,
  onOpenChange,
  onJobStarted,
  providers,
}: TriggerGeocodeDialogProps) {
  const [county, setCounty] = useState("")
  const [provider, setProvider] = useState("auto")
  const [forceRegeocode, setForceRegeocode] = useState(false)
  const [fallback, setFallback] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const batchMutation = useBatchGeocode()

  const configuredProviders = providers?.filter((p) => p.is_configured) ?? []

  const handleSubmit = () => {
    if (!county.trim() && !showConfirmation) {
      setShowConfirmation(true)
      return
    }

    batchMutation.mutate(
      {
        county: county.trim() || undefined,
        provider: provider === "auto" ? undefined : provider,
        force_regeocode: forceRegeocode || undefined,
        fallback: fallback || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Batch geocoding job started")
          onJobStarted()
          handleOpenChange(false)
        },
        onError: () => {
          // Error is shown via the inline <Alert> when batchMutation.isError is true
        },
      },
    )
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCounty("")
      setProvider("auto")
      setForceRegeocode(false)
      setFallback(false)
      setShowConfirmation(false)
      batchMutation.reset()
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Batch Geocode</DialogTitle>
          <DialogDescription>
            Geocode voter addresses that don&apos;t have cached locations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="geocode-county">County (optional)</Label>
            <Input
              id="geocode-county"
              placeholder="e.g. bibb"
              value={county}
              onChange={(e) => {
                setCounty(e.target.value)
                setShowConfirmation(false)
              }}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to geocode all voters across all counties.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="geocode-provider">Provider (optional)</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="geocode-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (default)</SelectItem>
                {configuredProviders.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose a specific provider or use the default fallback order.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="force-regeocode"
              checked={forceRegeocode}
              onCheckedChange={(checked) =>
                setForceRegeocode(checked === true)
              }
            />
            <Label htmlFor="force-regeocode" className="text-sm font-normal">
              Force re-geocode (overwrite cached results)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="fallback"
              checked={fallback}
              onCheckedChange={(checked) => setFallback(checked === true)}
            />
            <Label htmlFor="fallback" className="text-sm font-normal">
              Use cascading fallback for non-EXACT results
            </Label>
          </div>

          {showConfirmation && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No county specified. This will geocode{" "}
                <strong>ALL voters</strong> without locations, which may take a
                while. Click &quot;Start Geocoding&quot; again to confirm.
              </AlertDescription>
            </Alert>
          )}

          {batchMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to start geocoding: {batchMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={batchMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={batchMutation.isPending}>
            {batchMutation.isPending ? "Starting..." : "Start Geocoding"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
