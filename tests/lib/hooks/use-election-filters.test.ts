import { describe, it, expect, beforeEach } from "vitest"
import { useElectionFilters } from "@/lib/hooks/use-election-filters"

describe("useElectionFilters", () => {
  beforeEach(() => {
    // Reset store between tests
    useElectionFilters.setState({
      electionFilters: {
        status: "all",
        election_type: "all",
        date_from: null,
        date_to: null,
        registration_open: undefined,
        early_voting_active: undefined,
        search: undefined,
      },
      raceFilters: {
        search: "",
        category: "all",
      },
    })
  })

  describe("election filters", () => {
    it("has correct default values", () => {
      const state = useElectionFilters.getState()
      expect(state.electionFilters).toEqual({
        status: "all",
        election_type: "all",
        date_from: null,
        date_to: null,
        registration_open: undefined,
        early_voting_active: undefined,
        search: undefined,
      })
    })

    it("updates partial election filters", () => {
      useElectionFilters.getState().setElectionFilters({ status: "active" })
      const state = useElectionFilters.getState()
      expect(state.electionFilters.status).toBe("active")
      expect(state.electionFilters.election_type).toBe("all")
    })

    it("updates multiple election filters at once", () => {
      useElectionFilters.getState().setElectionFilters({
        status: "finalized",
        election_type: "general",
        date_from: "2026-01-01",
      })
      const state = useElectionFilters.getState()
      expect(state.electionFilters.status).toBe("finalized")
      expect(state.electionFilters.election_type).toBe("general")
      expect(state.electionFilters.date_from).toBe("2026-01-01")
      expect(state.electionFilters.date_to).toBeNull()
    })

    it("resets election filters to defaults", () => {
      useElectionFilters.getState().setElectionFilters({
        status: "active",
        election_type: "primary",
        date_from: "2026-01-01",
        date_to: "2026-12-31",
        registration_open: true,
        early_voting_active: true,
        search: "test",
      })
      useElectionFilters.getState().resetElectionFilters()
      const state = useElectionFilters.getState()
      expect(state.electionFilters).toEqual({
        status: "all",
        election_type: "all",
        date_from: null,
        date_to: null,
        registration_open: undefined,
        early_voting_active: undefined,
        search: undefined,
      })
    })

    it("updates registration_open filter", () => {
      useElectionFilters.getState().setElectionFilters({ registration_open: true })
      const state = useElectionFilters.getState()
      expect(state.electionFilters.registration_open).toBe(true)
    })

    it("updates early_voting_active filter", () => {
      useElectionFilters.getState().setElectionFilters({ early_voting_active: true })
      const state = useElectionFilters.getState()
      expect(state.electionFilters.early_voting_active).toBe(true)
    })

    it("updates search filter", () => {
      useElectionFilters.getState().setElectionFilters({ search: "Senate" })
      const state = useElectionFilters.getState()
      expect(state.electionFilters.search).toBe("Senate")
    })
  })

  describe("race filters", () => {
    it("has correct default values", () => {
      const state = useElectionFilters.getState()
      expect(state.raceFilters).toEqual({
        search: "",
        category: "all",
      })
    })

    it("updates search filter", () => {
      useElectionFilters.getState().setRaceFilters({ search: "Senate" })
      const state = useElectionFilters.getState()
      expect(state.raceFilters.search).toBe("Senate")
      expect(state.raceFilters.category).toBe("all")
    })

    it("updates category filter", () => {
      useElectionFilters.getState().setRaceFilters({ category: "federal" })
      const state = useElectionFilters.getState()
      expect(state.raceFilters.category).toBe("federal")
      expect(state.raceFilters.search).toBe("")
    })

    it("resets race filters to defaults", () => {
      useElectionFilters.getState().setRaceFilters({
        search: "House",
        category: "state_house",
      })
      useElectionFilters.getState().resetRaceFilters()
      const state = useElectionFilters.getState()
      expect(state.raceFilters).toEqual({
        search: "",
        category: "all",
      })
    })
  })

  it("election and race filters are independent", () => {
    useElectionFilters.getState().setElectionFilters({ status: "active" })
    useElectionFilters.getState().setRaceFilters({ search: "Senate" })

    useElectionFilters.getState().resetElectionFilters()
    const state = useElectionFilters.getState()
    expect(state.electionFilters.status).toBe("all")
    expect(state.raceFilters.search).toBe("Senate")
  })
})
