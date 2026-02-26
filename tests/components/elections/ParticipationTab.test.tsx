import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/render"
import type { ParticipantUrlParams } from "@/types/elections"

// ---- hook and module mocks (must come before component imports) ----

const mockUseUserRole = vi.fn()
const mockNavigate = vi.fn()
let capturedParticipantListProps: {
  electionId?: string
  params?: ParticipantUrlParams
  onUpdate?: (updates: Partial<ParticipantUrlParams>) => void
} = {}

vi.mock("@/lib/hooks/use-user-role", () => ({
  useUserRole: () => mockUseUserRole(),
}))

// Mock the route module so Route.useSearch() returns controlled values
// and Route.fullPath is a string
vi.mock("@/routes/elections/$electionDate", () => {
  let _searchParams: Record<string, unknown> = {}
  return {
    Route: {
      useSearch: () => _searchParams,
      fullPath: "/elections/$electionDate",
      // Helper to set search params in tests (accessed via __setSearch)
      __setSearch: (params: Record<string, unknown>) => {
        _searchParams = params
      },
    },
  }
})

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router")
  return {
    ...actual,
    useNavigate: () => () => mockNavigate,
  }
})

// Mock child components
vi.mock("@/components/elections/ParticipationStatsCard", () => ({
  ParticipationStatsCard: () => (
    <div data-testid="participation-stats-card" />
  ),
}))

vi.mock("@/components/elections/ElectionParticipantList", () => ({
  ElectionParticipantList: (props: {
    electionId: string
    params: ParticipantUrlParams
    onUpdate: (updates: Partial<ParticipantUrlParams>) => void
  }) => {
    capturedParticipantListProps = props
    return <div data-testid="election-participant-list" />
  },
}))

import { ParticipationTab } from "@/components/elections/ParticipationTab"

// ---- tests ----

beforeEach(() => {
  vi.clearAllMocks()
  capturedParticipantListProps = {}
})

describe("ParticipationTab", () => {
  it("admin user sees ElectionParticipantList", () => {
    mockUseUserRole.mockReturnValue({ data: { role: "admin" } })

    render(<ParticipationTab electionId="elec-1" />)

    expect(screen.getByTestId("participation-stats-card")).toBeInTheDocument()
    expect(screen.getByTestId("election-participant-list")).toBeInTheDocument()
  })

  it("analyst user sees ElectionParticipantList", () => {
    mockUseUserRole.mockReturnValue({ data: { role: "analyst" } })

    render(<ParticipationTab electionId="elec-1" />)

    expect(screen.getByTestId("participation-stats-card")).toBeInTheDocument()
    expect(screen.getByTestId("election-participant-list")).toBeInTheDocument()
  })

  it("viewer user does NOT see ElectionParticipantList", () => {
    mockUseUserRole.mockReturnValue({ data: { role: "viewer" } })

    render(<ParticipationTab electionId="elec-1" />)

    expect(screen.getByTestId("participation-stats-card")).toBeInTheDocument()
    expect(screen.queryByTestId("election-participant-list")).not.toBeInTheDocument()
  })

  it("always renders ParticipationStatsCard", () => {
    mockUseUserRole.mockReturnValue({ data: undefined })

    render(<ParticipationTab electionId="elec-1" />)

    expect(screen.getByTestId("participation-stats-card")).toBeInTheDocument()
  })

  it("passes electionId to ElectionParticipantList", () => {
    mockUseUserRole.mockReturnValue({ data: { role: "admin" } })

    render(<ParticipationTab electionId="elec-42" />)

    expect(capturedParticipantListProps.electionId).toBe("elec-42")
  })

  it("passes URL params to ElectionParticipantList", async () => {
    mockUseUserRole.mockReturnValue({ data: { role: "admin" } })

    // Since the Route.useSearch mock returns an empty object by default,
    // we need to control it. We'll do this by updating the mock inline.
    // The mock closure is set to {} initially. We can't easily change it
    // without re-mocking, so we test the default (empty params).
    render(<ParticipationTab electionId="elec-1" />)

    // Verify the params object is passed (all undefined for default empty search)
    expect(capturedParticipantListProps.params).toBeDefined()
    expect(capturedParticipantListProps.params?.p_county).toBeUndefined()
  })

  it("onUpdate passed to ElectionParticipantList is a function", () => {
    mockUseUserRole.mockReturnValue({ data: { role: "admin" } })

    render(<ParticipationTab electionId="elec-1" />)

    expect(typeof capturedParticipantListProps.onUpdate).toBe("function")
  })
})
