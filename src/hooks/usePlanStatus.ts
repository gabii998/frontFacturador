import { useCallback, useEffect, useRef, useState } from 'react'
import { PlansService, type PlanStatusResponse } from '../services/plans'

type UsePlanStatusOptions = {
  userId?: string | null
  onError?: (error: unknown) => void
}

export const usePlanStatus = ({ userId, onError }: UsePlanStatusOptions) => {
  const [planStatus, setPlanStatus] = useState<PlanStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const requestIdRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!userId) {
      setPlanStatus(null)
      setError(null)
      return
    }

    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    try {
      const response = await PlansService.getCurrent(userId)
      if (!mountedRef.current || requestId !== requestIdRef.current) return
      setPlanStatus(response)
    } catch (requestError) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return
      setPlanStatus(null)
      setError(requestError)
      onError?.(requestError)
    } finally {
      if (!mountedRef.current || requestId !== requestIdRef.current) return
      setLoading(false)
    }
  }, [onError, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    planStatus,
    loading,
    error,
    refresh
  }
}
