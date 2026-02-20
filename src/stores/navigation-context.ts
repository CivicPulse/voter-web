import { create } from "zustand"

interface NavigationContextState {
  /** Current state abbreviation from geographic navigation (e.g., "ga") */
  stateAbbrev: string | null
  /** Current county name from geographic navigation (e.g., "Bibb") */
  countyName: string | null
  /** Update the geographic context from the current route */
  setContext: (stateAbbrev: string | null, countyName: string | null) => void
}

export const useNavigationContext = create<NavigationContextState>((set) => ({
  stateAbbrev: null,
  countyName: null,
  setContext: (stateAbbrev, countyName) => set({ stateAbbrev, countyName }),
}))
