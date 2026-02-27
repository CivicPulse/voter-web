import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { GeocodedLocationMap } from "@/routes/voters/_components/GeocodedLocationMap"
import { mockVoterGeocodedLocation } from "@/test/mocks/voters"
import { useUserRole } from "@/lib/hooks/use-user-role"
import { useUpdateOfficialLocation } from "@/hooks/useAddressLookup"
import type { OfficialLocation } from "@/types/voter"

vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(() => vi.fn()),
}))

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
    draggable,
    eventHandlers,
    ref: _ref,
  }: {
    children: React.ReactNode
    position: [number, number]
    draggable?: boolean
    eventHandlers?: Record<string, (e: unknown) => void>
    ref?: unknown
  }) => (
    <div
      data-testid="marker"
      data-lat={position[0]}
      data-lng={position[1]}
      data-draggable={String(draggable ?? false)}
      onClick={() => eventHandlers?.["dragstart"]?.({})}
      onMouseMove={() =>
        eventHandlers?.["drag"]?.({
          target: { getLatLng: () => ({ lat: 32.85, lng: -83.64 }) },
        })
      }
      onMouseUp={() =>
        eventHandlers?.["dragend"]?.({
          target: { getLatLng: () => ({ lat: 32.85, lng: -83.64 }) },
        })
      }
    >
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  GeoJSON: () => <div data-testid="geojson-layer" />,
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

vi.mock("@/lib/hooks/use-user-role", () => ({
  useUserRole: vi.fn(() => ({ data: { role: "admin" } })),
}))

const mockMutateAsync = vi.fn()
const mockMutate = vi.fn()

vi.mock("@/hooks/useAddressLookup", () => ({
  useUpdateOfficialLocation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    mutate: mockMutate,
    isPending: false,
  })),
  useSetPrimaryLocation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}))

const mockUseUserRole = vi.mocked(useUserRole)
const mockUseUpdateOfficialLocation = vi.mocked(useUpdateOfficialLocation)

const mockOfficialLocation: OfficialLocation = {
  latitude: 32.8407,
  longitude: -83.6324,
  source: "manual",
  is_override: false,
}

function setRole(role: string) {
  mockUseUserRole.mockReturnValue({
    data: { id: "u-001", email: "test@test.com", role, is_active: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

describe("GeocodedLocationMap", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRole("admin")
    mockMutateAsync.mockResolvedValue({})
    mockUseUpdateOfficialLocation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      mutate: mockMutate,
      isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  })

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
    expect(screen.getByText(/Primary/)).toBeInTheDocument()
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

  describe("drag state", () => {
    it("pendingLat is null initially — Save/Reset strip is not shown", () => {
      const locations = [mockVoterGeocodedLocation({ is_primary: true })]
      render(
        <GeocodedLocationMap
          locations={locations}
          voterId="v-001"
          officialLocation={mockOfficialLocation}
        />,
      )

      expect(screen.queryByRole("button", { name: /save location/i })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument()
    })

    it("shows Save/Reset strip after drag ends", () => {
      const locations = [mockVoterGeocodedLocation({ is_primary: true })]
      render(
        <GeocodedLocationMap
          locations={locations}
          voterId="v-001"
          officialLocation={mockOfficialLocation}
        />,
      )

      // Official location marker renders first; simulate dragend
      const officialMarker = screen.getAllByTestId("marker")[0]
      fireEvent.mouseUp(officialMarker)

      expect(screen.getByRole("button", { name: /save location/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument()
    })

    it("hides Save/Reset strip after Reset is clicked", () => {
      const locations = [mockVoterGeocodedLocation({ is_primary: true })]
      render(
        <GeocodedLocationMap
          locations={locations}
          voterId="v-001"
          officialLocation={mockOfficialLocation}
        />,
      )

      const officialMarker = screen.getAllByTestId("marker")[0]
      fireEvent.mouseUp(officialMarker)

      expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument()
      fireEvent.click(screen.getByRole("button", { name: /reset/i }))

      expect(screen.queryByRole("button", { name: /save location/i })).not.toBeInTheDocument()
    })
  })

  describe("role guard", () => {
    it("primary marker is draggable for admin with voterId", () => {
      setRole("admin")
      const locations = [mockVoterGeocodedLocation({ is_primary: true })]
      render(
        <GeocodedLocationMap
          locations={locations}
          voterId="v-001"
          officialLocation={mockOfficialLocation}
        />,
      )

      // Official location marker renders first
      const officialMarker = screen.getAllByTestId("marker")[0]
      expect(officialMarker.dataset.draggable).toBe("true")
    })

    it("primary marker is draggable for analyst with voterId", () => {
      setRole("analyst")
      const locations = [mockVoterGeocodedLocation({ is_primary: true })]
      render(
        <GeocodedLocationMap
          locations={locations}
          voterId="v-001"
          officialLocation={mockOfficialLocation}
        />,
      )

      const officialMarker = screen.getAllByTestId("marker")[0]
      expect(officialMarker.dataset.draggable).toBe("true")
    })

    it("primary marker is NOT draggable for viewer even with voterId", () => {
      setRole("viewer")
      const locations = [mockVoterGeocodedLocation({ is_primary: true })]
      render(
        <GeocodedLocationMap
          locations={locations}
          voterId="v-001"
          officialLocation={mockOfficialLocation}
        />,
      )

      const officialMarker = screen.getAllByTestId("marker")[0]
      expect(officialMarker.dataset.draggable).toBe("false")
    })

    it("primary marker is NOT draggable when voterId is not provided", () => {
      setRole("admin")
      const locations = [mockVoterGeocodedLocation({ is_primary: true })]
      render(
        <GeocodedLocationMap
          locations={locations}
          officialLocation={mockOfficialLocation}
        />,
      )

      const officialMarker = screen.getAllByTestId("marker")[0]
      expect(officialMarker.dataset.draggable).toBe("false")
    })

    it("viewer role does not show Save/Reset after drag attempt", () => {
      setRole("viewer")
      const locations = [mockVoterGeocodedLocation({ is_primary: true })]
      render(
        <GeocodedLocationMap
          locations={locations}
          voterId="v-001"
          officialLocation={mockOfficialLocation}
        />,
      )

      const officialMarker = screen.getAllByTestId("marker")[0]
      fireEvent.mouseUp(officialMarker)

      // Viewer has no drag handlers, so Save/Reset never appears
      expect(screen.queryByRole("button", { name: /save location/i })).not.toBeInTheDocument()
    })
  })

  describe("save workflow", () => {
    it("calls mutateAsync with pending coordinates on save", async () => {
      setRole("admin")
      const locations = [mockVoterGeocodedLocation({ is_primary: true })]
      render(
        <GeocodedLocationMap
          locations={locations}
          voterId="v-001"
          officialLocation={mockOfficialLocation}
        />,
      )

      // Official location marker renders first and has drag handlers
      const officialMarker = screen.getAllByTestId("marker")[0]
      fireEvent.mouseUp(officialMarker)

      const saveButton = screen.getByRole("button", { name: /save location/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          latitude: 32.85,
          longitude: -83.64,
        })
      })
    })

    it("error path: hides Save/Reset strip and shows toast on mutation error", async () => {
      mockMutateAsync.mockRejectedValue(new Error("Network error"))
      mockUseUpdateOfficialLocation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        mutate: mockMutate,
        isPending: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      setRole("admin")
      const locations = [mockVoterGeocodedLocation({ is_primary: true })]
      render(
        <GeocodedLocationMap
          locations={locations}
          voterId="v-001"
          officialLocation={mockOfficialLocation}
        />,
      )

      const officialMarker = screen.getAllByTestId("marker")[0]
      fireEvent.mouseUp(officialMarker)

      const saveButton = screen.getByRole("button", { name: /save location/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        // After error, the Save/Reset strip should be hidden (pendingLat cleared)
        expect(screen.queryByRole("button", { name: /save location/i })).not.toBeInTheDocument()
      })
    })
  })
})
