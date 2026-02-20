import { Link } from "@tanstack/react-router"
import { MapPin } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ABBREV_TO_NAME } from "@/lib/states"
import type { StateInfo } from "@/hooks/useAvailableStates"

interface StateSelectionPageProps {
  states: StateInfo[]
}

export function StateSelectionPage({
  states,
}: Readonly<StateSelectionPageProps>) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Select a State</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a state to view its counties and districts
          </p>
        </div>
        <div className="space-y-3">
          {states.map((state) => {
            const stateName =
              ABBREV_TO_NAME[state.abbreviation] ??
              state.abbreviation.toUpperCase()
            return (
              <Link
                key={state.abbreviation}
                to="/$state"
                params={{ state: state.abbreviation }}
                className="block"
              >
                <Card className="transition-colors hover:bg-accent">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {stateName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {state.countyCount} {state.countyCount === 1 ? "county" : "counties"} with data
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
