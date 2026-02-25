import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { MapPin, RefreshCw, Star, Trash2, Navigation, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { useUserRole } from "@/lib/hooks/use-user-role"
import {
  useDeleteGeocodedLocation,
  useTriggerVoterGeocode,
  useSetOfficialLocation,
  useClearOfficialLocationOverride,
} from "@/hooks/useVoters"
import { useSetPrimaryLocation } from "@/hooks/useAddressLookup"
import type { VoterGeocodedLocation } from "@/types/lookup"
import type { OfficialLocation } from "@/types/voter"

const overrideSchema = z.object({
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
})

type OverrideFormValues = z.infer<typeof overrideSchema>

interface GeocodedLocationsCardProps {
  locations: VoterGeocodedLocation[]
  voterId: string
  officialLocation?: OfficialLocation | null
}

export function GeocodedLocationsCard({
  locations,
  voterId,
  officialLocation,
}: Readonly<GeocodedLocationsCardProps>) {
  const { data: userProfile } = useUserRole()
  const isAdmin = userProfile?.role === "admin"
  const canEdit = isAdmin || userProfile?.role === "analyst"

  const setPrimaryMutation = useSetPrimaryLocation(voterId)
  const deleteMutation = useDeleteGeocodedLocation(voterId)
  const geocodeMutation = useTriggerVoterGeocode(voterId)
  const setOfficialMutation = useSetOfficialLocation(voterId)
  const clearOverrideMutation = useClearOfficialLocationOverride(voterId)

  const [deleteTarget, setDeleteTarget] = useState<VoterGeocodedLocation | null>(null)
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [clearOverrideDialogOpen, setClearOverrideDialogOpen] = useState(false)

  const overrideForm = useForm<OverrideFormValues>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      latitude: officialLocation?.latitude ?? 0,
      longitude: officialLocation?.longitude ?? 0,
    },
  })

  function handleGeocode() {
    geocodeMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Geocoding complete. Locations updated.")
      },
      onError: () => {
        toast.error("Failed to trigger geocoding.")
      },
    })
  }

  function handleSetOfficial(locationId: string) {
    setPrimaryMutation.mutate(locationId, {
      onSuccess: () => {
        toast.success("Official location updated.")
      },
      onError: () => {
        toast.error("Failed to set official location.")
      },
    })
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Location removed.")
        setDeleteTarget(null)
      },
      onError: () => {
        toast.error("Failed to remove location.")
        setDeleteTarget(null)
      },
    })
  }

  function handleOverrideSubmit(values: OverrideFormValues) {
    setOfficialMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Official location override set.")
        setOverrideDialogOpen(false)
        overrideForm.reset()
      },
      onError: () => {
        toast.error("Failed to set official location override.")
      },
    })
  }

  function handleClearOverrideConfirm() {
    clearOverrideMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Official location override cleared.")
        setClearOverrideDialogOpen(false)
      },
      onError: () => {
        toast.error("Failed to clear official location override.")
        setClearOverrideDialogOpen(false)
      },
    })
  }

  if (locations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geocoded Locations
            </CardTitle>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeocode}
                disabled={geocodeMutation.isPending}
                title="Geocode Voter"
              >
                <RefreshCw className={`h-4 w-4 mr-2${geocodeMutation.isPending ? " animate-spin" : ""}`} />
                Geocode
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No geocoded locations available for this voter.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geocoded Locations
            </CardTitle>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeocode}
                disabled={geocodeMutation.isPending}
                title="Geocode Voter"
              >
                <RefreshCw className={`h-4 w-4 mr-2${geocodeMutation.isPending ? " animate-spin" : ""}`} />
                Geocode
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {officialLocation && (
            <div className="mb-4 p-3 rounded-md border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Official Location</span>
                  <Badge variant="secondary" className="text-xs">
                    {officialLocation.source}
                  </Badge>
                  {officialLocation.is_override && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      Override
                    </Badge>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        overrideForm.reset({
                          latitude: officialLocation.latitude,
                          longitude: officialLocation.longitude,
                        })
                        setOverrideDialogOpen(true)
                      }}
                    >
                      Override Location
                    </Button>
                    {officialLocation.is_override && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setClearOverrideDialogOpen(true)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear Override
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm font-mono mt-1 text-muted-foreground">
                {officialLocation.latitude.toFixed(6)}, {officialLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}
          {!officialLocation && isAdmin && (
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  overrideForm.reset({ latitude: 0, longitude: 0 })
                  setOverrideDialogOpen(true)
                }}
              >
                <Navigation className="h-4 w-4 mr-1" />
                Set Official Location Override
              </Button>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Coordinates</TableHead>
                {canEdit && <TableHead className="w-[1%]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow
                  key={loc.id}
                  className={loc.is_primary ? "bg-primary/5" : undefined}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {loc.source_type}
                      {loc.is_primary && (
                        <Badge variant="default" className="text-xs">
                          Official
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {loc.confidence_score == null
                      ? "—"
                      : `${(loc.confidence_score * 100).toFixed(0)}%`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {loc.input_address ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!loc.is_primary && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSetOfficial(loc.id)}
                            disabled={setPrimaryMutation.isPending}
                            title="Set as Official"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(loc)}
                          disabled={deleteMutation.isPending}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove geocoded location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the {deleteTarget?.source_type}{" "}
              location
              {deleteTarget?.is_primary &&
                " and clear the current district assignments"}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Official Location</DialogTitle>
            <DialogDescription>
              Manually set the official location coordinates for this voter.
              This will override the geocoded location for district
              verification.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={overrideForm.handleSubmit(handleOverrideSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="override-latitude">Latitude</Label>
                <Input
                  id="override-latitude"
                  type="number"
                  step="any"
                  {...overrideForm.register("latitude", { valueAsNumber: true })}
                />
                {overrideForm.formState.errors.latitude && (
                  <p className="text-sm text-destructive">
                    {overrideForm.formState.errors.latitude.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="override-longitude">Longitude</Label>
                <Input
                  id="override-longitude"
                  type="number"
                  step="any"
                  {...overrideForm.register("longitude", { valueAsNumber: true })}
                />
                {overrideForm.formState.errors.longitude && (
                  <p className="text-sm text-destructive">
                    {overrideForm.formState.errors.longitude.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOverrideDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={setOfficialMutation.isPending}>
                {setOfficialMutation.isPending ? "Saving..." : "Save Override"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={clearOverrideDialogOpen}
        onOpenChange={setClearOverrideDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear location override?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the admin override and revert to the
              automatically determined official location. District
              verification will be recalculated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearOverrideConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Override
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
