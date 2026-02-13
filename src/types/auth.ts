export type UserRole = "admin" | "analyst" | "viewer"

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: "bearer"
  expires_in: number
}

export interface UserProfile {
  id: string
  username: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

export interface LoginCredentials {
  username: string
  password: string
}
