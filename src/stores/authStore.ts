import { create } from "zustand"

interface AuthState {
  isAuthenticated: boolean
  checkAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem("access_token"),
  checkAuth: () =>
    set({ isAuthenticated: !!localStorage.getItem("access_token") }),
}))
