import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/render"
import { mockCandidateDetail, mockCandidateLink } from "@/test/mocks/candidates"
import type { CandidateDetail } from "@/types/candidates"

// ---- hook & router mocks ----

const mockUseCandidateDetail = vi.fn()

// Container object so the hoisted vi.mock can write to it
const captured: { Component: React.ComponentType | null } = { Component: null }

vi.mock("@/lib/hooks/use-candidates", () => ({
  useCandidateDetail: (...args: unknown[]) => mockUseCandidateDetail(...args),
}))

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router")
  return {
    ...actual,
    Link: ({
      children,
      ...props
    }: Record<string, unknown>) => (
      <a {...props}>{children as React.ReactNode}</a>
    ),
    createFileRoute:
      () =>
      (routeOpts: { component?: React.ComponentType }) => {
        if (routeOpts.component) {
          captured.Component = routeOpts.component
        }
        return {
          useParams: () => ({ candidateId: "cand-uuid-001" }),
        }
      },
  }
})

// Force module evaluation to capture the component via our mock
await import("@/routes/candidates/$candidateId")

// ---- helpers ----

function setupSuccess(overrides?: Partial<CandidateDetail>) {
  mockUseCandidateDetail.mockReturnValue({
    data: mockCandidateDetail(overrides),
    isLoading: false,
    error: null,
  })
}

function setupLoading() {
  mockUseCandidateDetail.mockReturnValue({
    data: null,
    isLoading: true,
    error: null,
  })
}

function setupError(message = "Server error") {
  mockUseCandidateDetail.mockReturnValue({
    data: null,
    isLoading: false,
    error: new Error(message),
  })
}

function renderPage() {
  if (!captured.Component)
    throw new Error(
      "Component was not captured from createFileRoute mock",
    )
  return render(<captured.Component />)
}

// ---- tests ----

beforeEach(() => {
  vi.clearAllMocks()
  setupSuccess()
})

describe("CandidateDetailPage", () => {
  it("renders candidate name", () => {
    renderPage()

    // Name appears in both heading and breadcrumb
    const headings = screen.getAllByText("Andrea C. Cooke")
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it("renders party badge", () => {
    renderPage()

    expect(screen.getByText("Dem")).toBeInTheDocument()
  })

  it("renders Incumbent badge when is_incumbent is true", () => {
    setupSuccess({ is_incumbent: true })
    renderPage()

    expect(screen.getByText("Incumbent")).toBeInTheDocument()
  })

  it("does not render Incumbent badge when is_incumbent is false", () => {
    setupSuccess({ is_incumbent: false })
    renderPage()

    expect(screen.queryByText("Incumbent")).not.toBeInTheDocument()
  })

  it("renders filing status badge when not qualified", () => {
    setupSuccess({ filing_status: "withdrawn" })
    renderPage()

    expect(screen.getByText("Withdrawn")).toBeInTheDocument()
  })

  it("does not render filing status badge when qualified", () => {
    setupSuccess({ filing_status: "qualified" })
    renderPage()

    expect(screen.queryByText("qualified")).not.toBeInTheDocument()
  })

  it("shows bio section when bio is present", () => {
    setupSuccess({
      bio: "Community advocate and former city council member.",
    })
    renderPage()

    expect(screen.getByText("About")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Community advocate and former city council member.",
      ),
    ).toBeInTheDocument()
  })

  it("hides bio section when bio is null", () => {
    setupSuccess({ bio: null })
    renderPage()

    expect(screen.queryByText("About")).not.toBeInTheDocument()
  })

  it("shows external links", () => {
    setupSuccess({
      links: [
        mockCandidateLink({
          id: "l-1",
          link_type: "campaign",
          url: "https://example.com/campaign",
          label: "My Campaign",
        }),
        mockCandidateLink({
          id: "l-2",
          link_type: "twitter",
          url: "https://twitter.com/candidate",
          label: "@candidate",
        }),
      ],
    })
    renderPage()

    expect(screen.getByText("Links")).toBeInTheDocument()
    expect(screen.getByText("My Campaign")).toBeInTheDocument()
    expect(screen.getByText("@candidate")).toBeInTheDocument()
  })

  it("hides links section when there are no links", () => {
    setupSuccess({ links: [] })
    renderPage()

    expect(screen.queryByText("Links")).not.toBeInTheDocument()
  })

  it("shows results section when result_vote_count is non-null", () => {
    setupSuccess({
      result_vote_count: 15234,
      result_political_party: "Democratic",
    })
    renderPage()

    expect(screen.getByText("Election Results")).toBeInTheDocument()
    expect(screen.getByText("15,234")).toBeInTheDocument()
    expect(screen.getByText("Democratic")).toBeInTheDocument()
  })

  it("hides results section when result_vote_count is null", () => {
    setupSuccess({ result_vote_count: null })
    renderPage()

    expect(screen.queryByText("Election Results")).not.toBeInTheDocument()
  })

  it("shows back-navigation link", () => {
    renderPage()

    const backLink = screen.getByText(/back to election/i)
    expect(backLink).toBeInTheDocument()
  })

  it("shows breadcrumb with Elections link", () => {
    renderPage()

    expect(screen.getByText("Elections")).toBeInTheDocument()
  })

  it("shows error state for failed fetch", () => {
    setupError("Something went wrong")
    renderPage()

    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByText("Back to elections")).toBeInTheDocument()
  })

  it("shows 'Candidate not found.' when data is null and no error", () => {
    mockUseCandidateDetail.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    })
    renderPage()

    expect(screen.getByText("Candidate not found.")).toBeInTheDocument()
  })

  it("shows loading spinner while loading", () => {
    setupLoading()
    const { container } = renderPage()

    const spinner = container.querySelector(".animate-spin")
    expect(spinner).toBeInTheDocument()
  })

  it("renders avatar fallback initials", () => {
    setupSuccess({ full_name: "Andrea C. Cooke", photo_url: null })
    renderPage()

    // getCandidateInitials("Andrea C. Cooke") => "AC"
    expect(screen.getByText("AC")).toBeInTheDocument()
  })
})
