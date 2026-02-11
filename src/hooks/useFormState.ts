import { useCallback, useRef, useState } from 'react'

export const useFormState = <T extends object>(initialValues: T) => {
  const initialRef = useRef(initialValues)
  const [values, setValues] = useState<T>(initialValues)

  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const setFields = useCallback((patch: Partial<T>) => {
    setValues(prev => ({ ...prev, ...patch }))
  }, [])

  const reset = useCallback((patch?: Partial<T>) => {
    setValues({ ...initialRef.current, ...patch })
  }, [])

  return {
    values,
    setField,
    setFields,
    reset
  }
}
