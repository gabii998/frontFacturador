import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { OnboardingService, type AfipCredentialStatus } from '../services/onboarding'

interface OnboardingContextValue {
  status: AfipCredentialStatus | null
  loading: boolean
  error: unknown
  refresh: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AfipCredentialStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await OnboardingService.status()
      setStatus(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  const value = useMemo<OnboardingContextValue>(() => ({
    status,
    loading,
    error,
    refresh: fetchStatus
  }), [status, loading, error, fetchStatus])

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding debe usarse dentro de OnboardingProvider')
  return ctx
}
