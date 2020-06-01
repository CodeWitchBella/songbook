import React, {
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from 'react'
import { ServiceWorkerRegisterConfig } from 'serviceWorker'
import { Workbox } from 'workbox-window'

const context = React.createContext({
  updated: null as null | Workbox,
  hideUpdated: () => {},
})
const refContext = React.createContext({
  updated: { current: null as null | Workbox },
})

export const ServiceWorkerStatusProvider: React.FC<{
  register: (config?: ServiceWorkerRegisterConfig) => void
}> = ({ children, register }) => {
  const [updated, setUpdated] = useState(null as null | Workbox)
  const updatedRef = useRef(updated)
  const providedValue = useMemo(
    () => ({
      updated,
      hideUpdated: () => {
        setUpdated(null)
      },
    }),
    [updated],
  )

  useEffect(() => {
    register({
      onUpdate: (wb) => {
        console.log('Update available!')
        setUpdated(wb)
        updatedRef.current = wb
      },
    })
  }, [register])
  return (
    <refContext.Provider value={useMemo(() => ({ updated: updatedRef }), [])}>
      <context.Provider value={providedValue}>{children}</context.Provider>
    </refContext.Provider>
  )
}

export function useServiceWorkerStatus() {
  return useContext(context)
}

function useServiceWorkerStatusRef() {
  return useContext(refContext)
}

export function useRefreshIfUpdated() {
  const { updated } = useServiceWorkerStatusRef()
  return useCallback(() => {
    if (updated.current) {
      ;(updated.current as any).messageSW({ type: 'SKIP_WAITING' })
    }
  }, [updated])
}
