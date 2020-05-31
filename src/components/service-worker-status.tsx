import React, { useContext, useEffect, useState, useMemo } from 'react'
import { ServiceWorkerRegisterConfig } from 'serviceWorker'
import { Workbox } from 'workbox-window'

const context = React.createContext({
  updated: null as null | Workbox,
  hideUpdated: () => {},
})

export const ServiceWorkerStatusProvider: React.FC<{
  register: (config?: ServiceWorkerRegisterConfig) => void
}> = ({ children, register }) => {
  const [updated, setUpdated] = useState(null as null | Workbox)
  const providedValue = useMemo(
    () => ({ updated, hideUpdated: () => setUpdated(null) }),
    [updated],
  )

  useEffect(() => {
    register({
      onUpdate: (wb) => setUpdated(wb),
    })
  }, [register])
  return <context.Provider value={providedValue}>{children}</context.Provider>
}

export function useServiceWorkerStatus() {
  return useContext(context)
}
