import { useState } from "react"
import { MapPin, Star, Trash2 } from "lucide-react"
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
import { useUserRole } from "@/lib/hooks/use-user-role"
import { useDeleteGeocodedLocation } from "@/hooks/useVoters"
import { useSetPrimaryLocation } from "@/hooks/useAddressLookup"
import type { VoterGeocodedLocation } from "@/types/lookup"

interface GeocodedLocationsCardProps {
  locations: VoterGeocodedLocation[]
  voterId: string
}

export function GeocodedLocationsCard({
  locations,
  voterId,
}: GeocodedLocationsCardProps) {
  const { data: userProfile } = useUserRole()
  const canEdit =
    userProfile?.role === "admin" || userProfile?.role === "analyst"

  const setPrimaryMutation = useSetPrimaryLocation(voterId)
  const deleteMutation = useDeleteGeocodedLocation(voterId)

  const [deleteTarget, setDeleteTarget] = useState<VoterGeocodedLocation | null>(null)

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

  if (locations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geocoded Locations
          </CardTitle>
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
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geocoded Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    {loc.confidence_score != null
                      ? `${(loc.confidence_score * 100).toFixed(0)}%`
                      : "—"}
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
    </>
  )
}
