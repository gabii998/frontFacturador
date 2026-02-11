import { useCallback, useState } from 'react'
import { useAsyncRequest } from './useAsyncRequest'

export function useAsyncResource<TData>(initialData: TData) {
  const [data, setData] = useState<TData>(initialData)
  const { loading, error, success, run, resetState } = useAsyncRequest<TData>()

  const load = useCallback(async (request: () => Promise<TData>) => {
    const result = await run(request)
    if (result.ok) {
      setData(result.data)
    }
    return result
  }, [run])

  return {
    data,
    setData,
    loading,
    error,
    success,
    load,
    resetState
  }
}

