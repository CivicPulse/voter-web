import { create } from "zustand"
import {
  login as apiLogin,
  refreshTokens as apiRefreshTokens,
  getMe,
} from "@/api/auth"
import type {
  LoginCredentials,
  TokenResponse,
  UserProfile,
} from "@/types/auth"

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: UserProfile | null
  isAuthenticated: boolean
  isInitialized: boolean

  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshTokens: () => Promise<TokenResponse>
  fetchUser: () => Promise<void>
  initialize: () => Promise<void>
  setTokens: (tokens: TokenResponse) => void
  checkAuth: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: localStorage.getItem("access_token"),
  refreshToken: localStorage.getItem("refresh_token"),
  user: null,
  isAuthenticated: !!localStorage.getItem("access_token"),
  isInitialized: false,

  initialize: async () => {
    const token = localStorage.getItem("access_token")
    if (token) {
      try {
        await get().fetchUser()
      } catch {
        get().logout()
      }
    }
    set({ isInitialized: true })
  },

  login: async (credentials) => {
    const tokens = await apiLogin(credentials)
    get().setTokens(tokens)
    await get().fetchUser()
  },

  logout: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    })
  },

  refreshTokens: async () => {
    const currentRefreshToken = get().refreshToken
    if (!currentRefreshToken) {
      throw new Error("No refresh token available")
    }
    const tokens = await apiRefreshTokens(currentRefreshToken)
    get().setTokens(tokens)
    return tokens
  },

  fetchUser: async () => {
    const user = await getMe()
    set({ user })
  },

  setTokens: (tokens: TokenResponse) => {
    localStorage.setItem("access_token", tokens.access_token)
    localStorage.setItem("refresh_token", tokens.refresh_token)
    set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isAuthenticated: true,
    })
  },

  checkAuth: () => {
    set({ isAuthenticated: !!localStorage.getItem("access_token") })
  },
}))
