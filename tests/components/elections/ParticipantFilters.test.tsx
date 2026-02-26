import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { render } from "@/test/render"
import type { ParticipantUrlParams } from "@/types/elections"

// ---- hook mocks (must come before component import) ----

const mockUseParticipationStats = vi.fn()
const mockUseVoterFilters = vi.fn()

vi.mock("@/lib/hooks/use-participation-stats", () => ({
  useParticipationStats: (...args: unknown[]) => mockUseParticipationStats(...args),
}))

vi.mock("@/hooks/useVoters", () => ({
  useVoterFilters: (...args: unknown[]) => mockUseVoterFilters(...args),
}))

import { ParticipantFilters } from "@/components/elections/ParticipantFilters"

// ---- mock data ----

const mockStats = {
  election_id: "elec-1",
  total_voted: 100,
  is_preliminary: true,
  county_breakdown: [
    { county: "Bibb", count: 50, percentage: 50 },
    { county: "Houston", count: 50, percentage: 50 },
  ],
  method_breakdown: [
    { method: "Absentee by Mail", count: 30, percentage: 30 },
    { method: "In Person", count: 70, percentage: 70 },
  ],
}

const mockFilters = {
  statuses: ["Active", "Inactive", "Cancelled"],
  counties: [],
  county_precincts: ["001A", "002B"],
  congressional_districts: ["001", "002", "008"],
  state_senate_districts: ["010", "015"],
  state_house_districts: ["020", "025"],
  county_commission_districts: [],
  school_board_districts: [],
}

const defaultParams: ParticipantUrlParams = {}

function setupDefaultMocks() {
  mockUseParticipationStats.mockReturnValue({ data: mockStats })
  mockUseVoterFilters.mockReturnValue({ data: mockFilters, isFetching: false })
}

// ---- tests ----

beforeEach(() => {
  vi.clearAllMocks()
  setupDefaultMocks()
})

describe("ParticipantFilters", () => {
  it("county dropdown renders options from stats", () => {
    render(
      <ParticipantFilters
        electionId="elec-1"
        params={defaultParams}
        onUpdate={vi.fn()}
      />,
    )

    // The Select trigger should show the label "All Counties" by default
    expect(screen.getByRole("combobox", { name: /filter by county/i })).toBeInTheDocument()

    // County options exist in the document (even if hidden in SelectContent)
    expect(screen.getAllByText("All Counties").length).toBeGreaterThan(0)
  })

  it("county selection calls onUpdate with selected county", async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()

    render(
      <ParticipantFilters
        electionId="elec-1"
        params={defaultParams}
        onUpdate={onUpdate}
      />,
    )

    // Open the county dropdown
    await user.click(screen.getByRole("combobox", { name: /filter by county/i }))

    // Select "Bibb"
    await user.click(screen.getByRole("option", { name: "Bibb" }))

    expect(onUpdate).toHaveBeenCalledWith({ p_county: "Bibb", p_page: undefined })
  })

  it("selecting 'All Counties' calls onUpdate with undefined county", async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()

    render(
      <ParticipantFilters
        electionId="elec-1"
        params={{ p_county: "Bibb" }}
        onUpdate={onUpdate}
      />,
    )

    // Open the county dropdown
    await user.click(screen.getByRole("combobox", { name: /filter by county/i }))

    // Select "All Counties"
    await user.click(screen.getByRole("option", { name: "All Counties" }))

    expect(onUpdate).toHaveBeenCalledWith({ p_county: undefined, p_page: undefined })
  })

  it("voter status dropdown renders options from filters", () => {
    render(
      <ParticipantFilters
        electionId="elec-1"
        params={defaultParams}
        onUpdate={vi.fn()}
      />,
    )

    expect(screen.getByRole("combobox", { name: /filter by voter status/i })).toBeInTheDocument()
    expect(screen.getAllByText("All Statuses").length).toBeGreaterThan(0)
  })

  it("status selection calls onUpdate with selected status", async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()

    render(
      <ParticipantFilters
        electionId="elec-1"
        params={defaultParams}
        onUpdate={onUpdate}
      />,
    )

    await user.click(screen.getByRole("combobox", { name: /filter by voter status/i }))
    await user.click(screen.getByRole("option", { name: "Active" }))

    expect(onUpdate).toHaveBeenCalledWith({ p_voter_status: "Active", p_page: undefined })
  })

  it("mismatch dropdown renders static options", () => {
    render(
      <ParticipantFilters
        electionId="elec-1"
        params={defaultParams}
        onUpdate={vi.fn()}
      />,
    )

    expect(screen.getByRole("combobox", { name: /filter by district check/i })).toBeInTheDocument()
    expect(screen.getAllByText("All Districts").length).toBeGreaterThan(0)
  })

  it("'Mismatch Only' calls onUpdate with 'true'", async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()

    render(
      <ParticipantFilters
        electionId="elec-1"
        params={defaultParams}
        onUpdate={onUpdate}
      />,
    )

    await user.click(screen.getByRole("combobox", { name: /filter by district check/i }))
    await user.click(screen.getByRole("option", { name: "Mismatch Only" }))

    expect(onUpdate).toHaveBeenCalledWith({ p_mismatch: "true", p_page: undefined })
  })

  it("'All Districts' calls onUpdate with undefined mismatch", async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()

    render(
      <ParticipantFilters
        electionId="elec-1"
        params={{ p_mismatch: "true" }}
        onUpdate={onUpdate}
      />,
    )

    await user.click(screen.getByRole("combobox", { name: /filter by district check/i }))
    await user.click(screen.getByRole("option", { name: "All Districts" }))

    expect(onUpdate).toHaveBeenCalledWith({ p_mismatch: undefined, p_page: undefined })
  })

  it("ballot style dropdown renders options from stats", () => {
    render(
      <ParticipantFilters
        electionId="elec-1"
        params={defaultParams}
        onUpdate={vi.fn()}
      />,
    )

    expect(screen.getByRole("combobox", { name: /filter by ballot style/i })).toBeInTheDocument()
    expect(screen.getAllByText("All Ballot Styles").length).toBeGreaterThan(0)
  })

  it("ballot style dropdown includes options from stats method_breakdown", async () => {
    const user = userEvent.setup()

    render(
      <ParticipantFilters
        electionId="elec-1"
        params={defaultParams}
        onUpdate={vi.fn()}
      />,
    )

    // Open the ballot style dropdown to see options
    await user.click(screen.getByRole("combobox", { name: /filter by ballot style/i }))

    expect(screen.getByRole("option", { name: "Absentee by Mail" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "In Person" })).toBeInTheDocument()
  })

  it("congressional district dropdown renders options from filters", async () => {
    const user = userEvent.setup()

    render(
      <ParticipantFilters
        electionId="elec-1"
        params={defaultParams}
        onUpdate={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("combobox", { name: /filter by congressional district/i }))

    expect(screen.getByRole("option", { name: "All Congressional" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "District 001" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "District 002" })).toBeInTheDocument()
  })

  it("precinct dropdown NOT shown when no county is selected", () => {
    render(
      <ParticipantFilters
        electionId="elec-1"
        params={defaultParams}
        onUpdate={vi.fn()}
      />,
    )

    expect(
      screen.queryByRole("combobox", { name: /filter by precinct/i }),
    ).not.toBeInTheDocument()
  })

  it("precinct dropdown shown when county is set and precincts are available", () => {
    render(
      <ParticipantFilters
        electionId="elec-1"
        params={{ p_county: "Bibb" }}
        onUpdate={vi.fn()}
      />,
    )

    // When county is set and county_precincts is non-empty, the precinct select renders
    expect(screen.getByRole("combobox", { name: /filter by precinct/i })).toBeInTheDocument()
    expect(screen.getAllByText("All Precincts").length).toBeGreaterThan(0)
  })

  it("precinct dropdown shows precinct options when county is set", async () => {
    const user = userEvent.setup()

    render(
      <ParticipantFilters
        electionId="elec-1"
        params={{ p_county: "Bibb" }}
        onUpdate={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("combobox", { name: /filter by precinct/i }))

    expect(screen.getByRole("option", { name: "001A" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "002B" })).toBeInTheDocument()
  })

  it("county change clears precinct from URL", () => {
    const onUpdate = vi.fn()

    // First render with a county and precinct set
    const { rerender } = render(
      <ParticipantFilters
        electionId="elec-1"
        params={{ p_county: "Bibb", p_precinct: "001A" }}
        onUpdate={onUpdate}
      />,
    )

    // Simulate county changing to Houston (as if URL params updated externally)
    rerender(
      <ParticipantFilters
        electionId="elec-1"
        params={{ p_county: "Houston", p_precinct: "001A" }}
        onUpdate={onUpdate}
      />,
    )

    // The useEffect should have fired to clear precinct
    expect(onUpdate).toHaveBeenCalledWith({ p_precinct: undefined, p_page: undefined })
  })
})
