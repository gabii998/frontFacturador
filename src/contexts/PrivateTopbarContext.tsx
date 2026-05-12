import { createContext, ReactNode, useContext, useEffect } from 'react'

type PrivateTopbarActionsSetter = (actions: ReactNode | null) => void

const PrivateTopbarActionsContext = createContext<PrivateTopbarActionsSetter | null>(null)

export function PrivateTopbarActionsProvider({
  children,
  setActions
}: {
  children: ReactNode
  setActions: PrivateTopbarActionsSetter
}) {
  return (
    <PrivateTopbarActionsContext.Provider value={setActions}>
      {children}
    </PrivateTopbarActionsContext.Provider>
  )
}

export function usePrivateTopbarActions(actions: ReactNode | null) {
  const setActions = useContext(PrivateTopbarActionsContext)

  useEffect(() => {
    if (!setActions) return undefined
    setActions(actions)

    return () => setActions(null)
  }, [actions, setActions])
}
