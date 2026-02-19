import { describe, it, expect } from "vitest"
import {
  getPartyColor,
  getVotePercentage,
  getReportingPercentage,
  resolvePrecinctCounts,
  categorizeRace,
  getCertificationLabel,
  isActiveElection,
  getTotalVotes,
  getLeadingCandidate,
  groupElectionsByDate,
  isReported,
  PARTY_COLORS,
  DEFAULT_PARTY_COLOR,
} from "@/types/elections"
import {
  mockElection,
  mockCandidateResult,
  mockElectionResultsResponse,
  mockCountyResult,
} from "@/test/mocks/elections"

describe("getPartyColor", () => {
  it("returns Dem color for 'Dem'", () => {
    expect(getPartyColor("Dem")).toEqual(PARTY_COLORS.Dem)
  })

  it("returns Rep color for 'Rep'", () => {
    expect(getPartyColor("Rep")).toEqual(PARTY_COLORS.Rep)
  })

  it("returns Lib color for 'Lib'", () => {
    expect(getPartyColor("Lib")).toEqual(PARTY_COLORS.Lib)
  })

  it("returns Grn color for 'Grn'", () => {
    expect(getPartyColor("Grn")).toEqual(PARTY_COLORS.Grn)
  })

  it("returns Ind color for 'Ind'", () => {
    expect(getPartyColor("Ind")).toEqual(PARTY_COLORS.Ind)
  })

  it("returns default color for unknown party", () => {
    expect(getPartyColor("Unknown")).toEqual(DEFAULT_PARTY_COLOR)
  })

  it("returns default color for empty string", () => {
    expect(getPartyColor("")).toEqual(DEFAULT_PARTY_COLOR)
  })
})

describe("getVotePercentage", () => {
  it("calculates percentage correctly", () => {
    expect(getVotePercentage(25, 100)).toBe(25)
  })

  it("handles fractional percentages", () => {
    expect(getVotePercentage(1, 3)).toBeCloseTo(33.333, 2)
  })

  it("returns 0 when totalVotes is 0", () => {
    expect(getVotePercentage(10, 0)).toBe(0)
  })

  it("returns 100 when all votes go to one candidate", () => {
    expect(getVotePercentage(500, 500)).toBe(100)
  })

  it("returns 0 when candidate has 0 votes", () => {
    expect(getVotePercentage(0, 100)).toBe(0)
  })
})

describe("getReportingPercentage", () => {
  it("calculates percentage correctly", () => {
    expect(getReportingPercentage(38, 45)).toBeCloseTo(84.44, 1)
  })

  it("returns 0 when participating is 0", () => {
    expect(getReportingPercentage(0, 0)).toBe(0)
  })

  it("returns 100 when all precincts report", () => {
    expect(getReportingPercentage(45, 45)).toBe(100)
  })

  it("returns 0 when none reporting", () => {
    expect(getReportingPercentage(0, 50)).toBe(0)
  })

  it("returns 0 when participating is null", () => {
    expect(getReportingPercentage(50, null)).toBe(0)
  })

  it("returns 0 when reporting is null", () => {
    expect(getReportingPercentage(null, 100)).toBe(0)
  })

  it("returns 0 when both are null", () => {
    expect(getReportingPercentage(null, null)).toBe(0)
  })

  it("returns 0 when participating is undefined", () => {
    expect(getReportingPercentage(50, undefined)).toBe(0)
  })
})

describe("resolvePrecinctCounts", () => {
  it("returns top-level values when present", () => {
    const results = mockElectionResultsResponse({
      precincts_participating: 100,
      precincts_reporting: 75,
    })
    expect(resolvePrecinctCounts(results)).toEqual({
      participating: 100,
      reporting: 75,
    })
  })

  it("sums county_results when top-level values are null", () => {
    const results = mockElectionResultsResponse({
      precincts_participating: null,
      precincts_reporting: null,
      county_results: [
        mockCountyResult({ precincts_participating: 45, precincts_reporting: 38 }),
        mockCountyResult({ precincts_participating: 30, precincts_reporting: 25 }),
      ],
    })
    expect(resolvePrecinctCounts(results)).toEqual({
      participating: 75,
      reporting: 63,
    })
  })

  it("returns 0 for both when null and county_results is empty", () => {
    const results = mockElectionResultsResponse({
      precincts_participating: null,
      precincts_reporting: null,
      county_results: [],
    })
    expect(resolvePrecinctCounts(results)).toEqual({
      participating: 0,
      reporting: 0,
    })
  })
})

describe("categorizeRace", () => {
  it("categorizes US Senate as federal", () => {
    expect(categorizeRace("US Senate - Georgia")).toBe("federal")
  })

  it("categorizes U.S. House as federal", () => {
    expect(categorizeRace("U.S. House District 5")).toBe("federal")
  })

  it("categorizes President as federal", () => {
    expect(categorizeRace("President of the United States")).toBe("federal")
  })

  it("categorizes State Senate as state_senate", () => {
    expect(categorizeRace("State Senate - District 18")).toBe("state_senate")
  })

  it("categorizes Senate District as state_senate", () => {
    expect(categorizeRace("Senate District 42")).toBe("state_senate")
  })

  it("categorizes State House as state_house", () => {
    expect(categorizeRace("State House - District 145")).toBe("state_house")
  })

  it("categorizes House District as state_house", () => {
    expect(categorizeRace("House District 101")).toBe("state_house")
  })

  it("categorizes Commissioner as local", () => {
    expect(categorizeRace("County Commissioner District 1")).toBe("local")
  })

  it("categorizes Board of Education as local", () => {
    expect(categorizeRace("Board of Education District 3")).toBe("local")
  })

  it("categorizes unknown districts as local", () => {
    expect(categorizeRace("Sheriff")).toBe("local")
  })
})

describe("getCertificationLabel", () => {
  it("returns 'Unofficial Results' for active status", () => {
    expect(getCertificationLabel("active")).toBe("Unofficial Results")
  })

  it("returns 'Official Results' for finalized status", () => {
    expect(getCertificationLabel("finalized")).toBe("Official Results")
  })
})

describe("isActiveElection", () => {
  it("returns true for active elections", () => {
    expect(isActiveElection(mockElection({ status: "active" }))).toBe(true)
  })

  it("returns false for finalized elections", () => {
    expect(isActiveElection(mockElection({ status: "finalized" }))).toBe(false)
  })
})

describe("getTotalVotes", () => {
  it("sums all candidate votes", () => {
    const candidates = [
      mockCandidateResult({ vote_count: 100 }),
      mockCandidateResult({ vote_count: 200 }),
      mockCandidateResult({ vote_count: 300 }),
    ]
    expect(getTotalVotes(candidates)).toBe(600)
  })

  it("returns 0 for empty array", () => {
    expect(getTotalVotes([])).toBe(0)
  })

  it("handles single candidate", () => {
    expect(getTotalVotes([mockCandidateResult({ vote_count: 42 })])).toBe(42)
  })
})

describe("getLeadingCandidate", () => {
  it("returns candidate with most votes", () => {
    const candidates = [
      mockCandidateResult({ id: "a", vote_count: 100 }),
      mockCandidateResult({ id: "b", vote_count: 300 }),
      mockCandidateResult({ id: "c", vote_count: 200 }),
    ]
    expect(getLeadingCandidate(candidates)?.id).toBe("b")
  })

  it("returns null for empty array", () => {
    expect(getLeadingCandidate([])).toBeNull()
  })

  it("returns the candidate when only one exists", () => {
    const candidates = [mockCandidateResult({ id: "solo", vote_count: 50 })]
    expect(getLeadingCandidate(candidates)?.id).toBe("solo")
  })
})

describe("groupElectionsByDate", () => {
  it("groups elections by date", () => {
    const elections = [
      mockElection({ id: "a", election_date: "2026-02-17" }),
      mockElection({ id: "b", election_date: "2026-02-17" }),
      mockElection({ id: "c", election_date: "2026-11-03" }),
    ]
    const events = groupElectionsByDate(elections)
    expect(events).toHaveLength(2)
  })

  it("sorts events by date descending", () => {
    const elections = [
      mockElection({ election_date: "2026-01-01" }),
      mockElection({ election_date: "2026-12-01" }),
      mockElection({ election_date: "2026-06-15" }),
    ]
    const events = groupElectionsByDate(elections)
    expect(events[0].date).toBe("2026-12-01")
    expect(events[1].date).toBe("2026-06-15")
    expect(events[2].date).toBe("2026-01-01")
  })

  it("computes distinct types for each event", () => {
    const elections = [
      mockElection({ election_date: "2026-02-17", election_type: "special" }),
      mockElection({ election_date: "2026-02-17", election_type: "special" }),
      mockElection({ election_date: "2026-02-17", election_type: "runoff" }),
    ]
    const events = groupElectionsByDate(elections)
    expect(events[0].types).toEqual(expect.arrayContaining(["special", "runoff"]))
    expect(events[0].types).toHaveLength(2)
  })

  it("computes raceCount correctly", () => {
    const elections = [
      mockElection({ election_date: "2026-02-17" }),
      mockElection({ election_date: "2026-02-17" }),
    ]
    const events = groupElectionsByDate(elections)
    expect(events[0].raceCount).toBe(2)
  })

  it("detects active races", () => {
    const elections = [
      mockElection({ election_date: "2026-02-17", status: "active" }),
      mockElection({ election_date: "2026-02-17", status: "finalized" }),
    ]
    const events = groupElectionsByDate(elections)
    expect(events[0].hasActiveRaces).toBe(true)
  })

  it("returns hasActiveRaces false when all finalized", () => {
    const elections = [
      mockElection({ election_date: "2026-02-17", status: "finalized" }),
      mockElection({ election_date: "2026-02-17", status: "finalized" }),
    ]
    const events = groupElectionsByDate(elections)
    expect(events[0].hasActiveRaces).toBe(false)
  })

  it("returns empty array for empty input", () => {
    expect(groupElectionsByDate([])).toEqual([])
  })
})

describe("isReported", () => {
  it("returns true for 'Reported'", () => {
    expect(isReported("Reported")).toBe(true)
  })

  it("returns true for 'Fully Reported'", () => {
    expect(isReported("Fully Reported")).toBe(true)
  })

  it("returns true for 'Partially Reported'", () => {
    expect(isReported("Partially Reported")).toBe(true)
  })

  it("returns true for 'Election Night Complete'", () => {
    expect(isReported("Election Night Complete")).toBe(true)
  })

  it("returns false for unknown status", () => {
    expect(isReported("Not Started")).toBe(false)
  })

  it("returns false for empty string", () => {
    expect(isReported("")).toBe(false)
  })
})
