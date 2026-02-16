import { Users, Mail, Phone, MapPin, ExternalLink } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useElectedOfficialsByDistrict } from "@/lib/hooks/use-elected-officials"
import type { ElectedOfficialDetailResponse } from "@/types/elected-officials"

function getPartyBadgeVariant(
  party: string | null,
): "default" | "destructive" | "secondary" | "outline" {
  if (!party) return "outline"
  const p = party.toLowerCase()
  if (p.includes("dem")) return "default"
  if (p.includes("rep")) return "destructive"
  return "secondary"
}

interface ElectedOfficialsCardProps {
  boundaryType: string
  districtIdentifier: string
}

export function ElectedOfficialsCard({
  boundaryType,
  districtIdentifier,
}: Readonly<ElectedOfficialsCardProps>) {
  const { data: officials, isLoading } = useElectedOfficialsByDistrict(
    boundaryType,
    districtIdentifier,
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Elected Officials
          </CardTitle>
          <CardDescription>Loading officials…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!officials || officials.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Elected Officials
          </CardTitle>
          <CardDescription>
            No elected official data available for this district
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Elected Officials
        </CardTitle>
        <CardDescription>
          {officials.length}{" "}
          {officials.length === 1 ? "official" : "officials"} representing this
          district
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {officials.map((official, index) => (
          <div key={official.id}>
            {index > 0 && <Separator className="mb-4" />}
            <OfficialEntry official={official} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function OfficialEntry({
  official,
}: Readonly<{ official: ElectedOfficialDetailResponse }>) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        {official.photo_url && (
          <img
            src={official.photo_url}
            alt={official.full_name}
            className="h-16 w-16 shrink-0 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        )}
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-semibold">
            {official.full_name}
          </h4>
          {official.title && (
            <p className="text-sm text-muted-foreground">{official.title}</p>
          )}
          {official.party && (
            <Badge variant={getPartyBadgeVariant(official.party)} className="mt-1">
              {official.party}
            </Badge>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-2 text-sm">
        {official.email && (
          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <dd>
              <a
                href={`mailto:${official.email}`}
                className="break-all text-primary hover:underline"
              >
                {official.email}
              </a>
            </dd>
          </div>
        )}
        {official.phone && (
          <div className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <dd>
              <a
                href={`tel:${official.phone}`}
                className="text-primary hover:underline"
              >
                {official.phone}
              </a>
            </dd>
          </div>
        )}
        {official.office_address && (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <dd className="text-muted-foreground">{official.office_address}</dd>
          </div>
        )}
        {official.website && (
          <div className="flex items-start gap-2">
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <dd>
              <a
                href={official.website}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-primary hover:underline"
              >
                {official.website}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {(official.term_start_date || official.term_end_date) && (
        <p className="text-xs text-muted-foreground">
          Term:{" "}
          {official.term_start_date
            ? new Date(official.term_start_date).toLocaleDateString()
            : "Unknown"}{" "}
          –{" "}
          {official.term_end_date
            ? new Date(official.term_end_date).toLocaleDateString()
            : "Present"}
        </p>
      )}
    </div>
  )
}
