import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { GeocodedLocationMap } from "@/routes/voters/_components/GeocodedLocationMap"
import { mockVoterGeocodedLocation } from "@/test/mocks/voters"

// Mock react-leaflet components
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children, className }: Record<string, unknown>) => (
    <div data-testid="map-container" className={className as string}>
      {children as React.ReactNode}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({
    children,
    position,
  }: {
    children: React.ReactNode
    position: [number, number]
  }) => (
    <div
      data-testid="marker"
      data-lat={position[0]}
      data-lng={position[1]}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => ({
    fitBounds: vi.fn(),
  }),
}))

vi.mock("leaflet", () => {
  const MockIcon = vi.fn()
  // Use a real function so `new L.Control(...)` works
  function MockControl() {
    return {
      onAdd: vi.fn(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    }
  }
  const mockDomUtil = {
    create: vi.fn().mockImplementation((_tag: string, _cls?: string, parent?: HTMLElement) => {
      const el = document.createElement("div")
      if (parent) parent.appendChild(el)
      return el
    }),
  }
  return {
    default: {
      Icon: MockIcon,
      divIcon: vi.fn((options: unknown) => ({ _isDivIcon: true, ...options as object })),
      latLngBounds: vi.fn().mockReturnValue({}),
      Control: MockControl,
      DomUtil: mockDomUtil,
    },
    Icon: MockIcon,
    latLngBounds: vi.fn().mockReturnValue({}),
  }
})

describe("GeocodedLocationMap", () => {
  it("renders map container with markers", () => {
    const locations = [
      mockVoterGeocodedLocation({ is_primary: true }),
      mockVoterGeocodedLocation({
        id: "loc-002",
        is_primary: false,
        source_type: "osm",
      }),
    ]
    render(<GeocodedLocationMap locations={locations} />)

    expect(screen.getByTestId("map-container")).toBeInTheDocument()
    expect(screen.getAllByTestId("marker")).toHaveLength(2)
  })

  it("does not render when locations is empty", () => {
    const { container } = render(<GeocodedLocationMap locations={[]} />)
    expect(container.innerHTML).toBe("")
  })

  it("shows provider name in popup", () => {
    const locations = [
      mockVoterGeocodedLocation({ source_type: "census", is_primary: true }),
    ]
    render(<GeocodedLocationMap locations={locations} />)

    expect(screen.getByText(/census/i)).toBeInTheDocument()
    expect(screen.getByText(/Official/)).toBeInTheDocument()
  })

  it("shows confidence score in popup", () => {
    const locations = [
      mockVoterGeocodedLocation({ confidence_score: 0.95 }),
    ]
    render(<GeocodedLocationMap locations={locations} />)

    expect(screen.getByText(/95%/)).toBeInTheDocument()
  })

  it("shows coordinates in popup", () => {
    const locations = [
      mockVoterGeocodedLocation({
        latitude: 32.8407,
        longitude: -83.6324,
      }),
    ]
    render(<GeocodedLocationMap locations={locations} />)

    expect(screen.getByText(/32\.840700/)).toBeInTheDocument()
    expect(screen.getByText(/-83\.632400/)).toBeInTheDocument()
  })
})
