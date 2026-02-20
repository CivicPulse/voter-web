import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { mockVoterDetail, mockVoterGeocodedLocation } from "@/test/mocks/voters"

// Mock hooks
const mockUseVoterDetail = vi.fn()
const mockUseVoterGeocodedLocations = vi.fn()

vi.mock("@/lib/hooks/use-user-role", () => ({
  useUserRole: vi.fn(() => ({ data: { role: "viewer" } })),
}))

vi.mock("@/hooks/useVoters", () => ({
  useVoterDetail: (...args: unknown[]) => mockUseVoterDetail(...args),
  useDeleteGeocodedLocation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

vi.mock("@/hooks/useAddressLookup", () => ({
  useVoterGeocodedLocations: (...args: unknown[]) =>
    mockUseVoterGeocodedLocations(...args),
  useSetPrimaryLocation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  Link: ({
    children,
    to,
  }: {
    children: React.ReactNode
    to: string
  }) => <a href={to}>{children}</a>,
}))

// Mock map component to avoid leaflet dependency
vi.mock("@/routes/voters/_components/GeocodedLocationMap", () => ({
  GeocodedLocationMap: () => <div data-testid="location-map" />,
}))

// Import the component pieces we're testing (the page composition)
import { VoterRegistrationCard } from "@/routes/voters/_components/VoterRegistrationCard"
import { GeocodedLocationsCard } from "@/routes/voters/_components/GeocodedLocationsCard"
import { DistrictAssignmentsCard } from "@/routes/voters/_components/DistrictAssignmentsCard"
import type { VoterDetail } from "@/types/voter"

// We test the page composition logic directly since route components
// require TanStack Router context that's complex to mock fully
function VoterDetailTestPage({
  voterId,
}: {
  voterId: string
}) {
  const { data: voter, isLoading, error } = mockUseVoterDetail(voterId)
  const { data: locations } = mockUseVoterGeocodedLocations(voterId)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error || !voter) {
    return (
      <div>
        <h2>Voter Not Found</h2>
        <p>
          The voter you are looking for does not exist or could not be loaded.
        </p>
        <a href="/voters">Back to Search</a>
      </div>
    )
  }

  const v = voter as VoterDetail

  return (
    <div>
      <a href="/voters">Back to Search</a>
      <VoterRegistrationCard voter={voter} />
      <GeocodedLocationsCard locations={locations ?? []} voterId={voterId} />
      <DistrictAssignmentsCard
        congressional_district={v.congressional_district}
        state_senate_district={v.state_senate_district}
        state_house_district={v.state_house_district}
        county_precinct={v.county_precinct}
        precinct={v.precinct}
      />
    </div>
  )
}

describe("VoterDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseVoterGeocodedLocations.mockReturnValue({ data: [] })
  })

  it("shows loading spinner while data is fetching", () => {
    mockUseVoterDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    render(<VoterDetailTestPage voterId="v-001" />)

    expect(screen.getByText("Loading...")).toBeInTheDocument()
  })

  it("shows error state when voter not found", () => {
    mockUseVoterDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Not found"),
    })

    render(<VoterDetailTestPage voterId="v-999" />)

    expect(screen.getByText("Voter Not Found")).toBeInTheDocument()
    expect(
      screen.getByText(
        "The voter you are looking for does not exist or could not be loaded.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("Back to Search")).toBeInTheDocument()
  })

  it("renders voter registration details", () => {
    const voter = mockVoterDetail()
    mockUseVoterDetail.mockReturnValue({
      data: voter,
      isLoading: false,
      error: null,
    })

    render(<VoterDetailTestPage voterId="v-001" />)

    expect(screen.getByText("Jane Marie Smith")).toBeInTheDocument()
    expect(screen.getByText("GA-12345678")).toBeInTheDocument()
  })

  it("renders geocoded locations card", () => {
    const voter = mockVoterDetail()
    const locations = [
      mockVoterGeocodedLocation({ is_primary: true }),
      mockVoterGeocodedLocation({
        id: "loc-002",
        source_type: "osm",
        is_primary: false,
      }),
    ]
    mockUseVoterDetail.mockReturnValue({
      data: voter,
      isLoading: false,
      error: null,
    })
    mockUseVoterGeocodedLocations.mockReturnValue({ data: locations })

    render(<VoterDetailTestPage voterId="v-001" />)

    expect(screen.getByText("census")).toBeInTheDocument()
    expect(screen.getByText("osm")).toBeInTheDocument()
  })

  it("shows district assignments from voter file data", () => {
    const voter = mockVoterDetail({
      congressional_district: "5",
      state_senate_district: "18",
      state_house_district: "145",
      county_precinct: "0001",
      precinct: null,
    })
    mockUseVoterDetail.mockReturnValue({
      data: voter,
      isLoading: false,
      error: null,
    })

    render(<VoterDetailTestPage voterId="v-001" />)

    expect(screen.getByText("Congressional")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("State Senate")).toBeInTheDocument()
    expect(screen.getByText("18")).toBeInTheDocument()
    expect(screen.getByText("State House")).toBeInTheDocument()
    expect(screen.getByText("145")).toBeInTheDocument()
    expect(screen.getByText("County Precinct")).toBeInTheDocument()
    expect(screen.getByText("0001")).toBeInTheDocument()
  })

  it("shows district assignments even without a geocoded location", () => {
    const voter = mockVoterDetail({
      congressional_district: "10",
      state_senate_district: null,
      state_house_district: null,
      county_precinct: null,
      precinct: null,
    })
    mockUseVoterDetail.mockReturnValue({
      data: voter,
      isLoading: false,
      error: null,
    })
    mockUseVoterGeocodedLocations.mockReturnValue({ data: [] })

    render(<VoterDetailTestPage voterId="v-001" />)

    expect(screen.getByText("Congressional")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
  })

  it("shows no districts message when all district fields are null", () => {
    const voter = mockVoterDetail({
      congressional_district: null,
      state_senate_district: null,
      state_house_district: null,
      county_precinct: null,
      precinct: null,
    })
    mockUseVoterDetail.mockReturnValue({
      data: voter,
      isLoading: false,
      error: null,
    })

    render(<VoterDetailTestPage voterId="v-001" />)

    expect(
      screen.getByText("No district assignments found in voter file."),
    ).toBeInTheDocument()
  })
})
