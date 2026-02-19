import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { mockVoterDetail, mockVoterGeocodedLocation } from "@/test/mocks/voters"

// Mock hooks
const mockUseVoterDetail = vi.fn()
const mockUseVoterGeocodedLocations = vi.fn()
const mockUsePointLookup = vi.fn()

vi.mock("@/hooks/useVoters", () => ({
  useVoterDetail: (...args: unknown[]) => mockUseVoterDetail(...args),
}))

vi.mock("@/hooks/useAddressLookup", () => ({
  useVoterGeocodedLocations: (...args: unknown[]) =>
    mockUseVoterGeocodedLocations(...args),
  usePointLookup: (...args: unknown[]) => mockUsePointLookup(...args),
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
import type { LookupDistrict } from "@/types/lookup"

// We test the page composition logic directly since route components
// require TanStack Router context that's complex to mock fully
function VoterDetailTestPage({
  voterId,
}: {
  voterId: string
}) {
  const { data: voter, isLoading, error } = mockUseVoterDetail(voterId)
  const { data: locations } = mockUseVoterGeocodedLocations(voterId)

  const officialLocation = locations?.find(
    (l: { is_primary: boolean }) => l.is_primary,
  ) ?? null
  const { data: pointLookup } = mockUsePointLookup(
    officialLocation
      ? { lat: officialLocation.latitude, lng: officialLocation.longitude }
      : null,
  )

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

  return (
    <div>
      <a href="/voters">Back to Search</a>
      <VoterRegistrationCard voter={voter} />
      <GeocodedLocationsCard locations={locations ?? []} voterId={voterId} />
      <DistrictAssignmentsCard
        districts={pointLookup?.districts ?? null}
        hasOfficialLocation={!!officialLocation}
      />
    </div>
  )
}

describe("VoterDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseVoterGeocodedLocations.mockReturnValue({ data: [] })
    mockUsePointLookup.mockReturnValue({ data: null })
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

  it("shows district assignments when official location exists", () => {
    const voter = mockVoterDetail()
    const locations = [
      mockVoterGeocodedLocation({ is_primary: true }),
    ]
    const districts: LookupDistrict[] = [
      {
        boundary_type: "county",
        name: "Bibb County",
        boundary_identifier: "bibb",
        boundary_id: "b-001",
        metadata: {},
      },
      {
        boundary_type: "congressional",
        name: "District 2",
        boundary_identifier: "ga-02",
        boundary_id: "b-002",
        metadata: {},
      },
    ]
    mockUseVoterDetail.mockReturnValue({
      data: voter,
      isLoading: false,
      error: null,
    })
    mockUseVoterGeocodedLocations.mockReturnValue({ data: locations })
    mockUsePointLookup.mockReturnValue({
      data: { districts },
    })

    render(<VoterDetailTestPage voterId="v-001" />)

    expect(screen.getByText("Bibb County")).toBeInTheDocument()
    expect(screen.getByText("District 2")).toBeInTheDocument()
  })

  it("shows no-location message for districts when no official location", () => {
    const voter = mockVoterDetail()
    const locations = [
      mockVoterGeocodedLocation({ is_primary: false }),
    ]
    mockUseVoterDetail.mockReturnValue({
      data: voter,
      isLoading: false,
      error: null,
    })
    mockUseVoterGeocodedLocations.mockReturnValue({ data: locations })
    mockUsePointLookup.mockReturnValue({ data: null })

    render(<VoterDetailTestPage voterId="v-001" />)

    expect(
      screen.getByText(
        "District assignments cannot be determined until an official location is selected.",
      ),
    ).toBeInTheDocument()
  })

  it("passes point lookup params from official location", () => {
    const voter = mockVoterDetail()
    const locations = [
      mockVoterGeocodedLocation({
        latitude: 32.8407,
        longitude: -83.6324,
        is_primary: true,
      }),
    ]
    mockUseVoterDetail.mockReturnValue({
      data: voter,
      isLoading: false,
      error: null,
    })
    mockUseVoterGeocodedLocations.mockReturnValue({ data: locations })
    mockUsePointLookup.mockReturnValue({ data: null })

    render(<VoterDetailTestPage voterId="v-001" />)

    expect(mockUsePointLookup).toHaveBeenCalledWith({
      lat: 32.8407,
      lng: -83.6324,
    })
  })

  it("passes null to point lookup when no official location", () => {
    const voter = mockVoterDetail()
    mockUseVoterDetail.mockReturnValue({
      data: voter,
      isLoading: false,
      error: null,
    })
    mockUseVoterGeocodedLocations.mockReturnValue({ data: [] })
    mockUsePointLookup.mockReturnValue({ data: null })

    render(<VoterDetailTestPage voterId="v-001" />)

    expect(mockUsePointLookup).toHaveBeenCalledWith(null)
  })
})
