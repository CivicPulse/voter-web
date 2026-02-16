import type {
  SosFeedResponse,
  SosFeedBallotItem,
  SosFeedResults,
} from "@/types/sos-feed"

// ============================================================================
// Factory Functions — Create mock SOS feed data with optional overrides
// ============================================================================

export function mockSosFeedBallotItem(
  overrides?: Partial<SosFeedBallotItem>,
): SosFeedBallotItem {
  return {
    type: "State",
    id: "SSD18",
    name: "State Senate - District 18",
    contestType: "Candidate",
    precinctsParticipating: 100,
    precinctsReporting: 95,
    ballotOptions: [],
    ...overrides,
  }
}

export function mockSosFeedResults(
  overrides?: Partial<SosFeedResults>,
): SosFeedResults {
  return {
    id: "feed-results-001",
    name: "Georgia",
    ballotItems: [mockSosFeedBallotItem()],
    reportingStatuses: [],
    ...overrides,
  }
}

export function mockSosFeedResponse(
  overrides?: Partial<SosFeedResponse>,
): SosFeedResponse {
  return {
    electionDate: "2026-01-20",
    electionName: "January 20, 2026 - Special Election",
    createdAt: "2026-01-20T22:00:00Z",
    results: mockSosFeedResults(),
    localResults: [],
    ...overrides,
  }
}

/** A multi-contest SOS feed with several ballot items */
export function mockMultiContestSosFeedResponse(): SosFeedResponse {
  return mockSosFeedResponse({
    electionName: "November 2026 - General Election",
    electionDate: "2026-11-03",
    results: mockSosFeedResults({
      ballotItems: [
        mockSosFeedBallotItem({
          id: "GOV",
          name: "Governor",
          type: "State",
        }),
        mockSosFeedBallotItem({
          id: "SOS",
          name: "Secretary of State",
          type: "State",
        }),
        mockSosFeedBallotItem({
          id: "AG",
          name: "Attorney General",
          type: "State",
        }),
      ],
    }),
  })
}
