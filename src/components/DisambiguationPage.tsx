import { Link } from "@tanstack/react-router"
import { MapPin } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ABBREV_TO_NAME } from "@/lib/states"
import type { DisambiguationMatch } from "@/hooks/useDistrictDisambiguation"

interface DisambiguationPageProps {
  matches: DisambiguationMatch[]
  typeSlug: string
  nameSlug: string
}

export function DisambiguationPage({
  matches,
  typeSlug,
  nameSlug,
}: Readonly<DisambiguationPageProps>) {
  const typeName = typeSlug.replaceAll("-", " ")

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Multiple Districts Found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The district <span className="font-medium capitalize">{typeName} {nameSlug}</span> exists
            in multiple locations. Select the one you're looking for:
          </p>
        </div>
        <div className="space-y-3">
          {matches.map((match) => {
            const stateName = ABBREV_TO_NAME[match.stateAbbrev] ?? match.stateAbbrev.toUpperCase()
            return (
              <Link
                key={match.districtId}
                to={match.fullyQualifiedUrl}
                className="block"
              >
                <Card className="transition-colors hover:bg-accent">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {match.name}
                    </CardTitle>
                    <CardDescription className="capitalize">
                      {match.boundaryType.replaceAll("_", " ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {match.county
                        ? `${match.county} County, ${stateName}`
                        : stateName}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
