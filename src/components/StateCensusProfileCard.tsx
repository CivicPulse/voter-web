import { BarChart3 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useStateCensusProfile } from "@/hooks/useStateCensusProfile"
import {
  CensusProfileSkeleton,
  CensusProfileError,
  CensusProfileSections,
} from "@/components/census/CensusProfileContent"

interface StateCensusProfileCardProps {
  fipsState: string
  stateName: string
}

export function StateCensusProfileCard({
  fipsState,
  stateName,
}: Readonly<StateCensusProfileCardProps>) {
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useStateCensusProfile(fipsState)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          State Census Demographics
        </CardTitle>
        <CardDescription>
          American Community Survey 5-Year Estimates (2023) for {stateName}
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
