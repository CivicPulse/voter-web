import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VoterSearchFilters } from "@/routes/voters/_components/VoterSearchFilters"
import { mockVoterFilterOptions } from "@/test/mocks/voters"
import { render } from "@/test/render"

const mockNavigate = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}))

const mockUseVoterFilters = vi.fn()

vi.mock("@/hooks/useVoters", () => ({
  useVoterFilters: (...args: unknown[]) => mockUseVoterFilters(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockUseVoterFilters.mockReturnValue({
    data: mockVoterFilterOptions(),
    isFetching: false,
  })
})

describe("VoterSearchFilters", () => {
  it("renders search input and all filter controls", () => {
    render(<VoterSearchFilters params={{}} />)

    expect(screen.getByLabelText("Search voters")).toBeInTheDocument()
    expect(screen.getByLabelText("Filter by county")).toBeInTheDocument()
    expect(screen.getByLabelText("Filter by status")).toBeInTheDocument()
    expect(screen.getByLabelText("Filter by congressional district")).toBeInTheDocument()
    expect(screen.getByLabelText("Filter by state senate district")).toBeInTheDocument()
    expect(screen.getByLabelText("Filter by state house district")).toBeInTheDocument()
  })

  it("shows default values in filter selects", () => {
    render(<VoterSearchFilters params={{}} />)

    expect(screen.getByText("All Counties")).toBeInTheDocument()
    expect(screen.getByText("All Statuses")).toBeInTheDocument()
    expect(screen.getByText("All Congressional")).toBeInTheDocument()
    expect(screen.getByText("All State Senate")).toBeInTheDocument()
    expect(screen.getByText("All State House")).toBeInTheDocument()
  })

  it("initializes search input from params", () => {
    render(<VoterSearchFilters params={{ q: "Smith" }} />)

    expect(screen.getByLabelText("Search voters")).toHaveValue("Smith")
  })

  it("debounces search input and navigates after delay", async () => {
    const user = userEvent.setup()
    render(<VoterSearchFilters params={{}} />)

    await user.type(screen.getByLabelText("Search voters"), "Smith")

    // After debounce fires (300ms)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ q: "Smith", page: 1 }),
        }),
      )
    })
  })

  it("renders search placeholder text", () => {
    render(<VoterSearchFilters params={{}} />)

    expect(
      screen.getByPlaceholderText("Search voters by name..."),
    ).toBeInTheDocument()
  })

  it("does not show county district row when no county selected", () => {
    render(<VoterSearchFilters params={{}} />)

    expect(screen.queryByText(/districts:/)).not.toBeInTheDocument()
  })

  it("passes county param to useVoterFilters", () => {
    render(<VoterSearchFilters params={{ county: "BIBB" }} />)

    expect(mockUseVoterFilters).toHaveBeenCalledWith({
      county: "BIBB",
      county_precinct: undefined,
      county_commission_district: undefined,
      school_board_district: undefined,
    })
  })

  it("passes cascading county-level params to useVoterFilters", () => {
    render(
      <VoterSearchFilters
        params={{
          county: "BIBB",
          county_precinct: "BI1",
          county_commission_district: "5",
        }}
      />,
    )

    expect(mockUseVoterFilters).toHaveBeenCalledWith({
      county: "BIBB",
      county_precinct: "BI1",
      county_commission_district: "5",
      school_board_district: undefined,
    })
  })

  it("shows county district dropdowns when filters include county data", () => {
    mockUseVoterFilters.mockReturnValue({
      data: mockVoterFilterOptions({
        county_precincts: ["BI1", "BI2", "BI3"],
        county_commission_districts: ["1", "2", "3"],
        school_board_districts: ["1", "2"],
      }),
      isFetching: false,
    })

    render(<VoterSearchFilters params={{ county: "BIBB" }} />)

    expect(screen.getByText("BIBB districts:")).toBeInTheDocument()
    expect(screen.getByLabelText("Filter by precinct")).toBeInTheDocument()
    expect(screen.getByLabelText("Filter by commission district")).toBeInTheDocument()
    expect(screen.getByLabelText("Filter by school board district")).toBeInTheDocument()
  })

  it("does not show county district row when county is set but no county-level data", () => {
    mockUseVoterFilters.mockReturnValue({
      data: mockVoterFilterOptions(),
      isFetching: false,
    })

    render(<VoterSearchFilters params={{ county: "BIBB" }} />)

    expect(screen.queryByText("BIBB districts:")).not.toBeInTheDocument()
  })
})
