import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GeocodedLocationsCard } from "@/routes/voters/_components/GeocodedLocationsCard"
import { mockVoterGeocodedLocation } from "@/test/mocks/voters"
import { useUserRole } from "@/lib/hooks/use-user-role"

const mockMutate = vi.fn()
const mockSetPrimaryMutate = vi.fn()
const mockDeleteMutate = vi.fn()

vi.mock("@/lib/hooks/use-user-role", () => ({
  useUserRole: vi.fn(() => ({ data: { role: "viewer" } })),
}))

vi.mock("@/hooks/useVoters", () => ({
  useTriggerGeocode: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
  useDeleteGeocodedLocation: vi.fn(() => ({
    mutate: mockDeleteMutate,
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

  // US3: Geocode trigger
  describe("geocode button", () => {
    it("is visible for admin users", () => {
      setRole("admin")
      render(<GeocodedLocationsCard locations={[]} voterId="v-001" />)

      expect(
        screen.getByRole("button", { name: /geocode/i }),
      ).toBeInTheDocument()
    })

    it("is visible for analyst users", () => {
      setRole("analyst")
      render(<GeocodedLocationsCard locations={[]} voterId="v-001" />)

      expect(
        screen.getByRole("button", { name: /geocode/i }),
      ).toBeInTheDocument()
    })

    it("is hidden for viewer users", () => {
      setRole("viewer")
      render(<GeocodedLocationsCard locations={[]} voterId="v-001" />)

      expect(
        screen.queryByRole("button", { name: /geocode/i }),
      ).not.toBeInTheDocument()
    })

    it("triggers geocode mutation on click", async () => {
      setRole("admin")
      const user = userEvent.setup()
      render(<GeocodedLocationsCard locations={[]} voterId="v-001" />)

      await user.click(screen.getByRole("button", { name: /geocode/i }))

      expect(mockMutate).toHaveBeenCalledOnce()
    })
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
