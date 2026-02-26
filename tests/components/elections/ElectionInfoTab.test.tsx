import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/render"
import { mockElection } from "@/test/mocks/elections"

// ---- Mock all child components ----

vi.mock("@/components/elections/CandidateList", () => ({
  CandidateList: ({ electionId }: { electionId: string }) => (
    <div data-testid="candidate-list" data-election-id={electionId} />
  ),
}))

vi.mock("@/components/elections/ElectionEligibility", () => ({
  ElectionEligibility: ({ election }: { election: { id: string } }) => (
    <div data-testid="election-eligibility" data-election-id={election.id} />
  ),
}))

vi.mock("@/components/elections/ElectionGeographicArea", () => ({
  ElectionGeographicArea: ({ election }: { election: { id: string } }) => (
    <div data-testid="election-geographic-area" data-election-id={election.id} />
  ),
}))

vi.mock("@/components/elections/ElectionKeyDates", () => ({
  ElectionKeyDates: ({ election }: { election: { id: string } }) => (
    <div data-testid="election-key-dates" data-election-id={election.id} />
  ),
}))

vi.mock("@/components/elections/ElectionMetadata", () => ({
  ElectionMetadata: ({ election }: { election: { id: string } }) => (
    <div data-testid="election-metadata" data-election-id={election.id} />
  ),
}))

import { ElectionInfoTab } from "@/components/elections/ElectionInfoTab"

// ---- tests ----

describe("ElectionInfoTab", () => {
  const election = mockElection()
  const electionId = election.id

  it("renders all 5 child sections", () => {
    render(<ElectionInfoTab election={election} electionId={electionId} />)

    expect(screen.getByTestId("candidate-list")).toBeInTheDocument()
    expect(screen.getByTestId("election-eligibility")).toBeInTheDocument()
    expect(screen.getByTestId("election-geographic-area")).toBeInTheDocument()
    expect(screen.getByTestId("election-key-dates")).toBeInTheDocument()
    expect(screen.getByTestId("election-metadata")).toBeInTheDocument()
  })

  it("passes electionId to CandidateList", () => {
    render(<ElectionInfoTab election={election} electionId={electionId} />)

    expect(screen.getByTestId("candidate-list")).toHaveAttribute(
      "data-election-id",
      electionId,
    )
  })

  it.each([
    "election-eligibility",
    "election-geographic-area",
    "election-key-dates",
    "election-metadata",
  ])("passes the election object to %s", (testId) => {
    render(<ElectionInfoTab election={election} electionId={electionId} />)

    expect(screen.getByTestId(testId)).toHaveAttribute(
      "data-election-id",
      election.id,
    )
  })
})
