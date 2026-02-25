import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GeocodedLocationsCard } from "@/routes/voters/_components/GeocodedLocationsCard"
import { mockVoterGeocodedLocation } from "@/test/mocks/voters"
import { useUserRole } from "@/lib/hooks/use-user-role"

const mockSetPrimaryMutate = vi.fn()
const mockDeleteMutate = vi.fn()
const mockGeocodeMutate = vi.fn()

vi.mock("@/lib/hooks/use-user-role", () => ({
  useUserRole: vi.fn(() => ({ data: { role: "viewer" } })),
}))

vi.mock("@/hooks/useVoters", () => ({
  useDeleteGeocodedLocation: vi.fn(() => ({
    mutate: mockDeleteMutate,
    isPending: false,
  })),
  useTriggerVoterGeocode: vi.fn(() => ({
    mutate: mockGeocodeMutate,
    isPending: false,
  })),
  useSetOfficialLocation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useClearOfficialLocationOverride: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}))

vi.mock("@/hooks/useAddressLookup", () => ({
  useSetPrimaryLocation: vi.fn(() => ({
    mutate: mockSetPrimaryMutate,
    isPending: false,
  })),
}))

const mockUseUserRole = vi.mocked(useUserRole)

function setRole(role: string) {
  mockUseUserRole.mockReturnValue({
    data: { id: "u-001", email: "test@test.com", role, is_active: true },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

describe("GeocodedLocationsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRole("viewer")
  })

  // Geocode button
  describe("geocode action", () => {
    it("shows geocode button for admin", () => {
      setRole("admin")
      render(<GeocodedLocationsCard locations={[]} voterId="v-001" />)

      expect(screen.getByTitle("Geocode Voter")).toBeInTheDocument()
    })

    it("shows geocode button for analyst", () => {
      setRole("analyst")
      render(<GeocodedLocationsCard locations={[]} voterId="v-001" />)

      expect(screen.getByTitle("Geocode Voter")).toBeInTheDocument()
    })

    it("hides geocode button for viewer", () => {
      setRole("viewer")
      render(<GeocodedLocationsCard locations={[]} voterId="v-001" />)

      expect(screen.queryByTitle("Geocode Voter")).not.toBeInTheDocument()
    })

    it("calls triggerVoterGeocode on click", async () => {
      setRole("admin")
      const user = userEvent.setup()
      render(<GeocodedLocationsCard locations={[]} voterId="v-001" />)

      await user.click(screen.getByTitle("Geocode Voter"))

      expect(mockGeocodeMutate).toHaveBeenCalled()
    })

    it("shows geocode button when locations exist", () => {
      setRole("admin")
      const locations = [mockVoterGeocodedLocation({ is_primary: true })]
      render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

      expect(screen.getByTitle("Geocode Voter")).toBeInTheDocument()
    })
  })

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

  it("shows dash when confidence_score is null", () => {
    const locations = [
      mockVoterGeocodedLocation({ confidence_score: null }),
    ]
    render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

    const cells = screen.getAllByRole("cell")
    expect(cells.some((c) => c.textContent === "—")).toBe(true)
  })

  it("shows dash when input_address is null", () => {
    const locations = [
      mockVoterGeocodedLocation({ input_address: null }),
    ]
    render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

    const cells = screen.getAllByRole("cell")
    expect(cells.some((c) => c.textContent === "—")).toBe(true)
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

  // US4: Set as Official
  describe("set official action", () => {
    it("shows set official button for non-primary locations when admin", () => {
      setRole("admin")
      const locations = [
        mockVoterGeocodedLocation({ is_primary: true }),
        mockVoterGeocodedLocation({
          id: "loc-002",
          is_primary: false,
          source_type: "osm",
        }),
      ]
      render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

      const starButtons = screen.getAllByTitle("Set as Official")
      expect(starButtons).toHaveLength(1)
    })

    it("does not show set official button for the primary location", () => {
      setRole("admin")
      const locations = [
        mockVoterGeocodedLocation({ is_primary: true }),
      ]
      render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

      expect(
        screen.queryByTitle("Set as Official"),
      ).not.toBeInTheDocument()
    })

    it("hides action buttons for viewer", () => {
      setRole("viewer")
      const locations = [
        mockVoterGeocodedLocation({ is_primary: false }),
      ]
      render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

      expect(screen.queryByTitle("Set as Official")).not.toBeInTheDocument()
      expect(screen.queryByTitle("Remove")).not.toBeInTheDocument()
    })

    it("calls setPrimaryLocation on click", async () => {
      setRole("admin")
      const user = userEvent.setup()
      const locations = [
        mockVoterGeocodedLocation({
          id: "loc-002",
          is_primary: false,
          source_type: "osm",
        }),
      ]
      render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

      await user.click(screen.getByTitle("Set as Official"))

      expect(mockSetPrimaryMutate).toHaveBeenCalledWith(
        "loc-002",
        expect.anything(),
      )
    })
  })

  // US5: Remove location
  describe("remove action", () => {
    it("shows remove button for admin", () => {
      setRole("admin")
      const locations = [
        mockVoterGeocodedLocation({ is_primary: true }),
      ]
      render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

      expect(screen.getByTitle("Remove")).toBeInTheDocument()
    })

    it("shows confirmation dialog on remove click", async () => {
      setRole("admin")
      const user = userEvent.setup()
      const locations = [
        mockVoterGeocodedLocation({
          source_type: "census",
          is_primary: false,
        }),
      ]
      render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

      await user.click(screen.getByTitle("Remove"))

      expect(
        screen.getByText("Remove geocoded location?"),
      ).toBeInTheDocument()
    })

    it("warns about clearing districts when removing official location", async () => {
      setRole("admin")
      const user = userEvent.setup()
      const locations = [
        mockVoterGeocodedLocation({
          source_type: "census",
          is_primary: true,
        }),
      ]
      render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

      await user.click(screen.getByTitle("Remove"))

      expect(
        screen.getByText(/clear the current district assignments/),
      ).toBeInTheDocument()
    })

    it("calls delete mutation on confirm", async () => {
      setRole("admin")
      const user = userEvent.setup()
      const locations = [
        mockVoterGeocodedLocation({ id: "loc-001", is_primary: false }),
      ]
      render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

      await user.click(screen.getByTitle("Remove"))
      await user.click(screen.getByRole("button", { name: "Remove" }))

      expect(mockDeleteMutate).toHaveBeenCalledWith(
        "loc-001",
        expect.anything(),
      )
    })

    it("closes dialog on cancel", async () => {
      setRole("admin")
      const user = userEvent.setup()
      const locations = [
        mockVoterGeocodedLocation({ is_primary: false }),
      ]
      render(<GeocodedLocationsCard locations={locations} voterId="v-001" />)

      await user.click(screen.getByTitle("Remove"))
      expect(
        screen.getByText("Remove geocoded location?"),
      ).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Cancel" }))

      expect(
        screen.queryByText("Remove geocoded location?"),
      ).not.toBeInTheDocument()
    })
  })
})
