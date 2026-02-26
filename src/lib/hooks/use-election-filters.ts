import { create } from "zustand"
import type { ElectionFilters, RaceFilters } from "@/types/elections"

interface ElectionFilterState {
  electionFilters: ElectionFilters
  raceFilters: RaceFilters
  setElectionFilters: (filters: Partial<ElectionFilters>) => void
  setRaceFilters: (filters: Partial<RaceFilters>) => void
  resetElectionFilters: () => void
  resetRaceFilters: () => void
}

const DEFAULT_ELECTION_FILTERS: ElectionFilters = {
  status: "all",
  election_type: "all",
  date_from: null,
  date_to: null,
  registration_open: undefined,
  early_voting_active: undefined,
  search: undefined,
}

const DEFAULT_RACE_FILTERS: RaceFilters = {
  search: "",
  category: "all",
}

export const useElectionFilters = create<ElectionFilterState>((set) => ({
  electionFilters: DEFAULT_ELECTION_FILTERS,
  raceFilters: DEFAULT_RACE_FILTERS,
  setElectionFilters: (filters) =>
    set((state) => ({
      electionFilters: { ...state.electionFilters, ...filters },
    })),
  setRaceFilters: (filters) =>
    set((state) => ({
      raceFilters: { ...state.raceFilters, ...filters },
    })),
  resetElectionFilters: () =>
    set({ electionFilters: DEFAULT_ELECTION_FILTERS }),
  resetRaceFilters: () => set({ raceFilters: DEFAULT_RACE_FILTERS }),
}))
