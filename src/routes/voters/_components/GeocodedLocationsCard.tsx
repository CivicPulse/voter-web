import { MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import type { VoterGeocodedLocation } from "@/types/lookup"

interface GeocodedLocationsCardProps {
  locations: VoterGeocodedLocation[]
  voterId: string
}

export function GeocodedLocationsCard({
  locations,
  voterId: _voterId,
}: GeocodedLocationsCardProps) {
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geocoded Locations
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Coordinates</TableHead>
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
                  {(loc.confidence_score * 100).toFixed(0)}%
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {loc.input_address}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
