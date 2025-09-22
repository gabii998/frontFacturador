import { post } from './api'

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export interface AuthResponse {
  token: string
  refreshToken?: string
  expiresIn: number
  user: AuthUser
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  name?: string
  cuit?: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface RefreshTokenPayload {
  refreshToken: string
}

export const AuthService = {
  login: (payload: LoginPayload) => post<AuthResponse>('/api/auth/login', payload),
  register: (payload: RegisterPayload) => post<AuthResponse>('/api/auth/register', payload),
  requestPasswordReset: (payload: ForgotPasswordPayload) => post<void>('/api/auth/password/forgot', payload),
  refresh: (payload: RefreshTokenPayload) => post<AuthResponse>('/api/auth/token/refresh', payload),
  logout: () => post<void>('/api/auth/logout', {})
}
