import { createFileRoute } from "@tanstack/react-router"
import {
  Info,
  Map,
  Vote,
  Database,
  Globe,
  ExternalLink,
  Scale,
  Github,
  BarChart3,
  Users,
  Landmark,
  Building2,
  Volume2,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export const Route = createFileRoute("/about")({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">About</h1>
          <p className="text-muted-foreground">
            Learn about CivicPulse Voter Data Explorer and the data sources that
            power it.
          </p>
        </div>

        <AboutSection />
        <Separator />
        <AuthorSection />
        <Separator />
        <DataCreditsSection />
        <Separator />
        <LicensingSection />
      </div>
    </div>
  )
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function AboutSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          About CivicPulse Voter Data Explorer
        </CardTitle>
        <CardDescription>
          An open-source tool for exploring voter and civic data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">
          CivicPulse Voter Data Explorer is a web application for visualizing
          and analyzing voter registration data, election boundaries, and
          demographic information across Georgia counties.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <FeatureItem
            icon={<Map className="h-4 w-4" />}
            title="Interactive Maps"
            description="Explore county boundaries, congressional districts, state house and senate districts, and public service commission districts on interactive maps."
          />
          <FeatureItem
            icon={<Database className="h-4 w-4" />}
            title="Demographic Data"
            description="View Census demographic profiles including population, age distribution, race and ethnicity, housing, and economic data for each county."
          />
          <FeatureItem
            icon={<Vote className="h-4 w-4" />}
            title="Voter Registration"
            description="Access voter registration data and analysis tools for Georgia counties (requires authentication)."
          />
          <FeatureItem
            icon={<BarChart3 className="h-4 w-4" />}
            title="Election Results"
            description="View live and historical election results with county and precinct-level choropleth maps, powered by the Georgia Secretary of State results feed."
          />
          <FeatureItem
            icon={<Users className="h-4 w-4" />}
            title="Elected Officials"
            description="See current elected representatives for congressional, state senate, and state house districts sourced from official government records."
          />
          <FeatureItem
            icon={<Globe className="h-4 w-4" />}
            title="Boundary Overlays"
            description="Toggle overlay layers to see how political districts intersect with county boundaries at both county and statewide levels."
          />
        </div>

        <a
          href="https://github.com/CivicPulse/voter-web"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
        >
          <Github className="h-4 w-4" />
          View on GitHub
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  )
}

function AuthorSection() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          Author & Maintainer
        </h2>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <img
            src="https://gravatar.com/avatar/369e5a0465c8b5c14db5372e77ffc5ea?s=80"
            alt="Kerry Hatcher"
            className="h-16 w-16 rounded-full"
          />
          <div className="space-y-1">
            <h3 className="font-semibold">Kerry Hatcher</h3>
            <p className="text-sm text-muted-foreground">
              Primary Author & Maintainer
            </p>
            <a
              href="https://github.com/kerryhatcher"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
            >
              <Github className="h-3.5 w-3.5" />
              kerryhatcher
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DataCreditsSection() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Data Credits</h2>
        <p className="text-sm text-muted-foreground">
          This application relies on the following public data sources.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-5 w-5" />
              US Census Bureau
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">
              County and district boundary geometries, demographic profiles, and
              geographic metadata are sourced from the US Census Bureau.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Census Data</Badge>
              <Badge variant="secondary">TIGER/Line Shapefiles</Badge>
              <Badge variant="secondary">American Community Survey</Badge>
            </div>
            <a
              href="https://www.census.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              census.gov
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Vote className="h-5 w-5" />
              Georgia Secretary of State
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">
              Voter registration records are provided by the Georgia Secretary of
              State's office. Live and historical election results are sourced
              from the SOS election results JSON feed at{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                results.sos.ga.gov
              </code>
              , which provides county and precinct-level vote totals, candidate
              data, and reporting status.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Voter Registration</Badge>
              <Badge variant="secondary">Election Results Feed</Badge>
              <Badge variant="secondary">Precinct Data</Badge>
            </div>
            <a
              href="https://sos.ga.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              sos.ga.gov
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-5 w-5" />
              Congress.gov API (Library of Congress)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">
              Current U.S. Senators and Representatives for Georgia are sourced
              from the Congress.gov API, the official legislative data service
              maintained by the Library of Congress.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">U.S. Congress Members</Badge>
              <Badge variant="secondary">Federal Officials</Badge>
            </div>
            <a
              href="https://api.congress.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              api.congress.gov
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5" />
              Open States (Plural Policy)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">
              Georgia state legislators (State Senate and State House) are
              sourced from the Open States API, a nonprofit civic data project
              maintained by Plural Policy.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">State Legislators</Badge>
              <Badge variant="secondary">State Senate</Badge>
              <Badge variant="secondary">State House</Badge>
            </div>
            <a
              href="https://openstates.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              openstates.org
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Map className="h-5 w-5" />
              OpenStreetMap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">
              Base map tiles displayed in the interactive maps are provided by
              OpenStreetMap contributors.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Map Tiles</Badge>
            </div>
            <a
              href="https://www.openstreetmap.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              openstreetmap.org
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LicensingSection() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Licensing</h2>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex gap-3">
            <Scale className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Source Code</h3>
              <p className="text-sm text-muted-foreground">
                Licensed under the{" "}
                <a
                  href="https://www.gnu.org/licenses/agpl-3.0.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  GNU Affero General Public License (AGPL-3.0)
                </a>
                .
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Map className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="text-sm font-medium">
                Custom Data & Map Graphics
              </h3>
              <p className="text-sm text-muted-foreground">
                Shared under{" "}
                <a
                  href="https://creativecommons.org/licenses/by-sa/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Creative Commons Attribution-ShareAlike 4.0 International (CC
                  BY-SA 4.0)
                </a>
                .
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Notification Sound</h3>
              <p className="text-sm text-muted-foreground">
                "Tannoy chime 01.wav" by{" "}
                <a
                  href="https://freesound.org/s/245954/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  kwahmah_02
                </a>
                , licensed under{" "}
                <a
                  href="https://creativecommons.org/licenses/by/3.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Creative Commons Attribution 3.0
                </a>
                .
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Database className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Original Data Sources</h3>
              <p className="text-sm text-muted-foreground">
                Original data from third-party sources is subject to each
                source's own terms and conditions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
