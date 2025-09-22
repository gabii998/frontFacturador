import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AuthService,
  type AuthResponse,
  type AuthUser,
  type ForgotPasswordPayload,
  type LoginPayload,
  type RegisterPayload
} from '../services/auth'
import { registerAuthInterceptor } from '../services/api'

interface AuthState {
  token: string | null
  refreshToken: string | null
  expiresAt: number | null
  user: AuthUser | null
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  isTokenExpired: boolean
  secondsToExpire: number | null
  login: (credentials: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  requestPasswordReset: (payload: ForgotPasswordPayload) => Promise<void>
  logout: () => Promise<void>
}

const STORAGE_KEY = 'afip.auth'

const blankState: AuthState = {
  token: null,
  refreshToken: null,
  expiresAt: null,
  user: null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredState(): AuthState {
  if (typeof window === 'undefined') return blankState
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return blankState
  try {
    const parsed = JSON.parse(raw) as AuthState
    if (parsed.expiresAt && parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY)
      return blankState
    }
    return {
      token: parsed.token ?? null,
      refreshToken: parsed.refreshToken ?? null,
      expiresAt: parsed.expiresAt ?? null,
      user: parsed.user ?? null
    }
  } catch (error) {
    console.warn('No se pudo leer el estado de autenticación', error)
    window.localStorage.removeItem(STORAGE_KEY)
    return blankState
  }
}

function persistState(state: AuthState) {
  if (typeof window === 'undefined') return
  if (!state.token) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => readStoredState())
  const logoutInFlight = useRef(false)

  const clearState = useCallback(() => {
    setState(blankState)
    persistState(blankState)
    registerAuthInterceptor(null)
  }, [])

  const applyAuth = useCallback((payload: AuthResponse) => {
    const expiresAt = Date.now() + payload.expiresIn * 1000
    const nextState: AuthState = {
      token: payload.token,
      refreshToken: payload.refreshToken ?? null,
      expiresAt,
      user: payload.user
    }
    setState(nextState)
    persistState(nextState)
    return nextState
  }, [])

  const logout = useCallback(async () => {
    if (logoutInFlight.current) return
    logoutInFlight.current = true
    try {
      await AuthService.logout().catch(() => undefined)
    } finally {
      clearState()
      logoutInFlight.current = false
    }
  }, [clearState])

  const login = useCallback(async (credentials: LoginPayload) => {
    const response = await AuthService.login(credentials)
    applyAuth(response)
  }, [applyAuth])

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await AuthService.register(payload)
    applyAuth(response)
  }, [applyAuth])

  const requestPasswordReset = useCallback(async (payload: ForgotPasswordPayload) => {
    await AuthService.requestPasswordReset(payload)
  }, [])

  useEffect(() => {
    if (!state.token) return
    registerAuthInterceptor({
      getToken: () => state.token,
      isTokenExpired: () => !!state.expiresAt && state.expiresAt <= Date.now(),
      onUnauthorized: () => {
        void logout()
      }
    })
    return () => {
      registerAuthInterceptor(null)
    }
  }, [state.token, state.expiresAt, logout])

  useEffect(() => {
    if (!state.expiresAt) return
    const millisecondsLeft = state.expiresAt - Date.now()
    if (millisecondsLeft <= 0) {
      void logout()
      return
    }
    const timeout = window.setTimeout(() => {
      void logout()
    }, millisecondsLeft)
    return () => window.clearTimeout(timeout)
  }, [state.expiresAt, logout])

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = Boolean(state.token)
    const isTokenExpired = !!state.expiresAt && state.expiresAt <= Date.now()
    const secondsToExpire = state.expiresAt
      ? Math.max(0, Math.floor((state.expiresAt - Date.now()) / 1000))
      : null

    return {
      ...state,
      isAuthenticated,
      isTokenExpired,
      secondsToExpire,
      login,
      register,
      requestPasswordReset,
      logout
    }
  }, [state, login, register, requestPasswordReset, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
