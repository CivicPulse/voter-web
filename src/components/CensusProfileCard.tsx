import { BarChart3 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCensusProfile } from "@/hooks/useCensusProfile"
import {
  CensusProfileSkeleton,
  CensusProfileError,
  CensusProfileSections,
} from "@/components/census/CensusProfileContent"

interface CensusProfileCardProps {
  fipsState: string
  fipsCounty: string
  countyName: string
}

export function CensusProfileCard({
  fipsState,
  fipsCounty,
  countyName,
}: Readonly<CensusProfileCardProps>) {
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useCensusProfile(fipsState, fipsCounty)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Census Demographics
        </CardTitle>
        <CardDescription>
          American Community Survey 5-Year Estimates (2023) for {countyName}{" "}
          County
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && <CensusProfileSkeleton />}
        {isError && (
          <CensusProfileError
            message={error instanceof Error ? error.message : ""}
          />
        )}
        {profile && <CensusProfileSections profile={profile} />}
      </CardContent>
    </Card>
  )
}
