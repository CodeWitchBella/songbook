import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react'
import { ServiceWorkerRegisterConfig } from 'serviceWorker'

const context = React.createContext({ updated: false, hideUpdated: () => {} })

export const ServiceWorkerStatusProvider: React.FC<{
  register: (config?: ServiceWorkerRegisterConfig) => void
}> = ({ children, register }) => {
  const [updated, setUpdated] = useState(false)
  const hideUpdated = useCallback(() => setUpdated(false), [])
  const providedValue = useMemo(() => ({ updated, hideUpdated }), [
    hideUpdated,
    updated,
  ])
  useEffect(() => {
    register({
      onUpdate: () => setUpdated(true),
    })
  }, [register])
  return <context.Provider value={providedValue}>{children}</context.Provider>
}

export function useServiceWorkerStatus() {
  return useContext(context)
}
