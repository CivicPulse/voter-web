import ky from "ky"
import { api } from "./client"
import type { LoginCredentials, TokenResponse, UserProfile } from "@/types/auth"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"

/** Unauthenticated client for login and refresh endpoints. */
const authClient = ky.create({
  prefixUrl: API_BASE_URL,
})

/**
 * Login with username/password (OAuth2 password grant).
 * The endpoint expects application/x-www-form-urlencoded, not JSON.
 */
export async function login(
  credentials: LoginCredentials,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    username: credentials.username,
    password: credentials.password,
  })

  return authClient
    .post("auth/login", {
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    .json<TokenResponse>()
}

/** Exchange a refresh token for a new token pair (JSON body). */
export async function refreshTokens(
  refreshToken: string,
): Promise<TokenResponse> {
  return authClient
    .post("auth/refresh", {
      json: { refresh_token: refreshToken },
    })
    .json<TokenResponse>()
}

/** Fetch the current user's profile (requires Bearer token). */
export async function getMe(): Promise<UserProfile> {
  return api.get("auth/me").json<UserProfile>()
}
