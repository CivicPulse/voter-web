import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { render } from "@/test/render"
import { mockParticipationStats } from "@/test/mocks/elections"
import type { ParticipationStats } from "@/types/elections"

const mockRefetch = vi.fn()
let mockHookReturn: {
  data: ParticipationStats | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

vi.mock("@/lib/hooks/use-participation-stats", () => ({
  useParticipationStats: () => mockHookReturn,
}))

// Mock the county-precinct-codes hook so the single-county precinct test doesn't need real API
let mockPrecinctCodesReturn: {
  data: Set<string> | undefined
  isLoading: boolean
}
vi.mock("@/lib/hooks/use-county-precinct-codes", () => ({
  useCountyPrecinctCodes: () => mockPrecinctCodesReturn,
}))

// Mock Recharts to avoid rendering SVG in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
}))

import { ParticipationStatsCard } from "@/components/elections/ParticipationStatsCard"

beforeEach(() => {
  vi.clearAllMocks()
  mockHookReturn = {
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  }
  mockPrecinctCodesReturn = {
    data: undefined,
    isLoading: false,
  }
})

describe("ParticipationStatsCard", () => {
  it("renders card title", () => {
    mockHookReturn.data = mockParticipationStats()
    render(<ParticipationStatsCard electionId="election-001" />)
    expect(screen.getByText("Participation Statistics")).toBeInTheDocument()
  })

  it("shows loading skeleton while fetching", () => {
    mockHookReturn.isLoading = true
    const { container } = render(
      <ParticipationStatsCard electionId="election-001" />,
    )
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("shows error state with retry button", async () => {
    mockHookReturn.isError = true
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(
      screen.getByText("Failed to load participation statistics."),
    ).toBeInTheDocument()

    const retryButton = screen.getByRole("button", { name: /retry/i })
    await userEvent.click(retryButton)
    expect(mockRefetch).toHaveBeenCalled()
  })

  it("shows empty state when no data available", () => {
    render(<ParticipationStatsCard electionId="election-001" />)
    expect(
      screen.getByText("No participation data available."),
    ).toBeInTheDocument()
  })

  it("renders votes cast headline figure", () => {
    mockHookReturn.data = mockParticipationStats()
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.getByTestId("total-voted")).toHaveTextContent("78,500")
    expect(screen.queryByText("Eligible Voters")).not.toBeInTheDocument()
    expect(screen.queryByText("Turnout")).not.toBeInTheDocument()
  })

  it("renders Preliminary badge when is_preliminary is true", () => {
    mockHookReturn.data = mockParticipationStats({ is_preliminary: true })
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.getByText("Preliminary")).toBeInTheDocument()
  })

  it("does not render Preliminary badge when is_preliminary is false", () => {
    mockHookReturn.data = mockParticipationStats({ is_preliminary: false })
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.queryByText("Preliminary")).not.toBeInTheDocument()
  })

  it("renders county breakdown section for multi-county elections", () => {
    mockHookReturn.data = mockParticipationStats()
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.getByText("By County")).toBeInTheDocument()
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument()
    // County legend entries
    expect(screen.getByText(/Bibb/)).toBeInTheDocument()
    expect(screen.getByText(/Houston/)).toBeInTheDocument()
  })

  it("hides county breakdown for single-county elections", () => {
    mockHookReturn.data = mockParticipationStats({
      county_breakdown: [{ county: "BIBB", count: 5000, percentage: 100 }],
    })
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.queryByText("By County")).not.toBeInTheDocument()
  })

  it("renders precinct breakdown when precinct data is available (single county)", () => {
    // Single county — no dropdown, precincts show directly with boundary codes
    mockPrecinctCodesReturn = {
      data: new Set(["P1", "P2"]),
      isLoading: false,
    }
    mockHookReturn.data = mockParticipationStats({
      county_breakdown: [{ county: "Bibb", count: 500, percentage: 100 }],
      precinct_breakdown: [
        { precinct: "P1", precinct_name: "Precinct 1", count: 300, percentage: 60 },
        { precinct: "P2", precinct_name: "Precinct 2", count: 200, percentage: 40 },
      ],
    })
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.getByText("By Precinct")).toBeInTheDocument()
    expect(screen.getByText(/Precinct 1/)).toBeInTheDocument()
    expect(screen.getByText(/Precinct 2/)).toBeInTheDocument()
  })

  it("renders county dropdown for multi-county precinct breakdown", () => {
    mockPrecinctCodesReturn = {
      data: new Set(["P1"]),
      isLoading: false,
    }
    mockHookReturn.data = mockParticipationStats({
      county_breakdown: [
        { county: "Bibb", count: 300, percentage: 60 },
        { county: "Houston", count: 200, percentage: 40 },
      ],
      precinct_breakdown: [
        { precinct: "P1", precinct_name: "Precinct 1", count: 300, percentage: 60 },
        { precinct: "P2", precinct_name: "Precinct 2", count: 200, percentage: 40 },
      ],
    })
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.getByText("By Precinct")).toBeInTheDocument()
    expect(screen.getByTestId("precinct-county-select")).toBeInTheDocument()
    // Defaults to first county (Bibb) — only P1 matches
    expect(screen.getByText(/Precinct 1/)).toBeInTheDocument()
    expect(screen.queryByText(/Precinct 2/)).not.toBeInTheDocument()
  })

  it("renders voting method breakdown section", () => {
    mockHookReturn.data = mockParticipationStats()
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.getByText("Voting Method")).toBeInTheDocument()
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument()
  })

  it("does not render charts when breakdowns are empty", () => {
    mockHookReturn.data = mockParticipationStats({
      county_breakdown: [],
      method_breakdown: [],
    })
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.queryByText("By County")).not.toBeInTheDocument()
    expect(screen.queryByText("Voting Method")).not.toBeInTheDocument()
  })
})
