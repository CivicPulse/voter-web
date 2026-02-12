import {
  BarChart3,
  AlertCircle,
  ExternalLink,
  Users,
  DollarSign,
  GraduationCap,
  Heart,
  Home,
  Car,
  Wifi,
  Globe,
  Briefcase,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { useCensusProfile } from "@/hooks/useCensusProfile"
import type { CensusProfile } from "@/types/census"
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDecimal,
} from "@/lib/formatters"

const ETHNICITY_COLORS = ["#4363d8", "#e6194b", "#3cb44b", "#f58231"]

interface CensusProfileCardProps {
  fipsState: string
  fipsCounty: string
  countyName: string
}

function StatSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </h3>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </dl>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

function EthnicityChart({ profile }: { profile: CensusProfile }) {
  const data = [
    { name: "White", value: profile.percentWhite },
    { name: "Black", value: profile.percentBlack },
    { name: "Asian", value: profile.percentAsian },
    { name: "Hispanic/Latino", value: profile.percentHispanicLatino },
  ].filter((d): d is { name: string; value: number } => d.value !== null)

  if (data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 100, right: 20, top: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
        />
        <YAxis type="category" dataKey="name" width={100} />
        <RechartsTooltip
          formatter={(value) => `${Number(value).toFixed(1)}%`}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={ETHNICITY_COLORS[index % ETHNICITY_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function CensusProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
      <Separator />
      <Skeleton className="h-48 w-full" />
      <Separator />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CensusProfileError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p>
        Unable to load Census data{message ? `: ${message}` : "."}
        {" "}Data is sourced from the US Census Bureau API and may be
        temporarily unavailable.
      </p>
    </div>
  )
}

export function CensusProfileCard({
  fipsState,
  fipsCounty,
  countyName,
}: CensusProfileCardProps) {
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
        {profile && (
          <>
            {/* Section 1: Population & Age */}
            <StatSection icon={Users} title="Population & Age">
              <StatItem
                label="Total Population"
                value={formatNumber(profile.totalPopulation)}
              />
              <StatItem
                label="Median Age"
                value={
                  profile.medianAge !== null
                    ? `${formatDecimal(profile.medianAge)} years`
                    : "N/A"
                }
              />
              <StatItem
                label="Under 18"
                value={formatPercent(profile.percentUnder18)}
              />
              <StatItem
                label="65 and Over"
                value={formatPercent(profile.percentOver65)}
              />
            </StatSection>

            <Separator />

            {/* Section 2: Race & Ethnicity */}
            <StatSection icon={Users} title="Race & Ethnicity">
              <StatItem
                label="White"
                value={formatPercent(profile.percentWhite)}
              />
              <StatItem
                label="Black or African American"
                value={formatPercent(profile.percentBlack)}
              />
              <StatItem
                label="Asian"
                value={formatPercent(profile.percentAsian)}
              />
              <StatItem
                label="Hispanic or Latino"
                value={formatPercent(profile.percentHispanicLatino)}
              />
            </StatSection>
            <EthnicityChart profile={profile} />

            <Separator />

            {/* Section 3: Community Profile */}
            <StatSection icon={Globe} title="Community Profile">
              <StatItem
                label="Foreign-Born"
                value={formatPercent(profile.percentForeignBorn)}
              />
              <StatItem
                label="Language Other Than English at Home"
                value={formatPercent(profile.percentNonEnglish)}
              />
              <StatItem
                label="Veterans"
                value={formatPercent(profile.percentVeterans)}
              />
            </StatSection>

            <Separator />

            {/* Section 4: Education */}
            <StatSection icon={GraduationCap} title="Education">
              <StatItem
                label="Bachelor's Degree or Higher"
                value={formatPercent(profile.percentBachelorsOrHigher)}
              />
              <StatItem
                label="Graduate or Professional Degree"
                value={formatPercent(profile.percentGraduateDegree)}
              />
            </StatSection>

            <Separator />

            {/* Section 5: Employment */}
            <StatSection icon={Briefcase} title="Employment">
              <StatItem
                label="Unemployment Rate"
                value={formatPercent(profile.unemploymentRate)}
              />
              <StatItem
                label="Work from Home"
                value={formatPercent(profile.percentWorkFromHome)}
              />
            </StatSection>

            <Separator />

            {/* Section 6: Income & Poverty */}
            <StatSection icon={DollarSign} title="Income & Poverty">
              <StatItem
                label="Median Household Income"
                value={formatCurrency(profile.medianHouseholdIncome)}
              />
              <StatItem
                label="Per Capita Income"
                value={formatCurrency(profile.perCapitaIncome)}
              />
              <StatItem
                label="Poverty Rate"
                value={formatPercent(profile.povertyRate)}
              />
              <StatItem
                label="SNAP/Food Stamp Recipients"
                value={formatPercent(profile.percentSnap)}
              />
            </StatSection>

            <Separator />

            {/* Section 7: Health & Accessibility */}
            <StatSection icon={Heart} title="Health & Accessibility">
              <StatItem
                label="Uninsured"
                value={formatPercent(profile.percentUninsured)}
              />
              <StatItem
                label="With a Disability"
                value={formatPercent(profile.percentDisability)}
              />
            </StatSection>

            <Separator />

            {/* Section 8: Housing */}
            <StatSection icon={Home} title="Housing">
              <StatItem
                label="Median Home Value"
                value={formatCurrency(profile.medianHomeValue)}
              />
              <StatItem
                label="Median Gross Rent"
                value={formatCurrency(profile.medianGrossRent)}
              />
              <StatItem
                label="Homeownership Rate"
                value={formatPercent(profile.homeownershipRate)}
              />
              <StatItem
                label="Vacancy Rate"
                value={formatPercent(profile.vacancyRate)}
              />
            </StatSection>

            <Separator />

            {/* Section 9: Transportation & Technology */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Car className="h-4 w-4 text-muted-foreground" />
                <Wifi className="h-4 w-4 text-muted-foreground" />
                Transportation & Technology
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatItem
                  label="Mean Commute Time"
                  value={
                    profile.meanCommuteTimeMinutes !== null
                      ? `${formatDecimal(profile.meanCommuteTimeMinutes)} min`
                      : "N/A"
                  }
                />
                <StatItem
                  label="No Vehicle Available"
                  value={formatPercent(profile.percentNoVehicle)}
                />
                <StatItem
                  label="Broadband Access"
                  value={formatPercent(profile.percentBroadband)}
                />
              </dl>
            </div>
          </>
        )}

        <Separator />

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            Data sourced from the{" "}
            <a
              href="https://api.census.gov/data.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              U.S. Census Bureau API
            </a>
            , American Community Survey (ACS) 5-Year Estimates, 2023 vintage.
            These estimates are based on data collected over a 5-year period and
            may differ from actual counts.
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
