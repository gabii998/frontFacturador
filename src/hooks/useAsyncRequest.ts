import { useCallback, useState } from 'react'

export type AsyncResult<TData> =
  | { ok: true, data: TData }
  | { ok: false, error: unknown }

export function useAsyncRequest<TDefaultData = void>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [success, setSuccess] = useState(false)
  const [data, setData] = useState<TDefaultData | null>(null)

  const run = useCallback(async <TData = TDefaultData>(
    request: () => Promise<TData>
  ): Promise<AsyncResult<TData>> => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const nextData = await request()
      setData(nextData as unknown as TDefaultData)
      setSuccess(true)
      return { ok: true, data: nextData }
    } catch (requestError) {
      setError(requestError)
      return { ok: false, error: requestError }
    } finally {
      setLoading(false)
    }
  }, [])

  const resetState = useCallback(() => {
    setLoading(false)
    setError(null)
    setSuccess(false)
    setData(null)
  }, [])

  return {
    loading,
    error,
    success,
    data,
    setError,
    setSuccess,
    setData,
    run,
    resetState
  }
}

