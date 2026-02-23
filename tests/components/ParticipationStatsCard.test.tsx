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

  it("renders headline figures", () => {
    mockHookReturn.data = mockParticipationStats()
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.getByTestId("total-eligible")).toHaveTextContent("125,000")
    expect(screen.getByTestId("total-voted")).toHaveTextContent("78,500")
    expect(screen.getByTestId("turnout-percentage")).toHaveTextContent("62.8%")
  })

  it("shows N/A for turnout when total_eligible is 0", () => {
    mockHookReturn.data = mockParticipationStats({
      total_eligible: 0,
      total_voted: 0,
      turnout_percentage: 0,
    })
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.getByTestId("turnout-percentage")).toHaveTextContent("N/A")
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

  it("renders party breakdown section", () => {
    mockHookReturn.data = mockParticipationStats()
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.getByText("Party Affiliation")).toBeInTheDocument()
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument()
    // Party legend entries
    expect(screen.getByText(/Dem/)).toBeInTheDocument()
    expect(screen.getByText(/Rep/)).toBeInTheDocument()
  })

  it("renders voting method breakdown section", () => {
    mockHookReturn.data = mockParticipationStats()
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.getByText("Voting Method")).toBeInTheDocument()
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument()
  })

  it("does not render charts when breakdowns are empty", () => {
    mockHookReturn.data = mockParticipationStats({
      party_breakdown: [],
      method_breakdown: [],
    })
    render(<ParticipationStatsCard electionId="election-001" />)

    expect(screen.queryByText("Party Affiliation")).not.toBeInTheDocument()
    expect(screen.queryByText("Voting Method")).not.toBeInTheDocument()
  })
})
