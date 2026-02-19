import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { GeocodedLocationsCard } from "@/routes/voters/_components/GeocodedLocationsCard"
import { mockVoterGeocodedLocation } from "@/test/mocks/voters"

describe("GeocodedLocationsCard", () => {
  it("renders location table with provider details", () => {
    const locations = [
      mockVoterGeocodedLocation({
        source_type: "census",
        confidence_score: 0.95,
        is_primary: true,
      }),
      mockVoterGeocodedLocation({
        id: "loc-002",
        source_type: "osm",
        confidence_score: 0.88,
        is_primary: false,
      }),
    ]
    render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

    expect(screen.getByText("census")).toBeInTheDocument()
    expect(screen.getByText("osm")).toBeInTheDocument()
    expect(screen.getByText("95%")).toBeInTheDocument()
    expect(screen.getByText("88%")).toBeInTheDocument()
  })

  it("highlights official location with badge", () => {
    const locations = [
      mockVoterGeocodedLocation({ is_primary: true }),
    ]
    render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

    expect(screen.getByText("Official")).toBeInTheDocument()
  })

  it("shows empty state when no locations", () => {
    render(<GeocodedLocationsCard locations={[]} voterId="v-001" />)

    expect(
      screen.getByText("No geocoded locations available for this voter."),
    ).toBeInTheDocument()
  })

  it("shows coordinates for each location", () => {
    const locations = [
      mockVoterGeocodedLocation({
        latitude: 32.8407,
        longitude: -83.6324,
      }),
    ]
    render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

    expect(
      screen.getByText("32.840700, -83.632400"),
    ).toBeInTheDocument()
  })

  it("shows input address", () => {
    const locations = [
      mockVoterGeocodedLocation({
        input_address: "123 Main St, Macon, GA 31201",
      }),
    ]
    render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

    expect(
      screen.getByText("123 Main St, Macon, GA 31201"),
    ).toBeInTheDocument()
  })
})
