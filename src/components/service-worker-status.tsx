import React, { useContext, useEffect, useMemo, useRef } from 'react'
import { ServiceWorkerRegisterConfig } from 'serviceWorker'
import { Workbox } from 'workbox-window'
import { useLocation } from 'react-router'

const context = React.createContext({
  updateAfterNavigate: () => {},
})

export const ServiceWorkerStatusProvider: React.FC<{
  register: (config?: ServiceWorkerRegisterConfig) => void
}> = ({ children, register }) => {
  const updatedRef = useRef(null as null | Workbox)
  const updateAfterNavigate = useRef(false)

  const location = useLocation()
  const lastPathname = useRef(location.pathname)

  useEffect(() => {
    const v = updateAfterNavigate.current
    const updated = updatedRef.current
    if (updated && v && location.pathname !== lastPathname.current) {
      setTimeout(() => {
        updated.messageSW({ type: 'SKIP_WAITING' })
      }, 10)
    }
    lastPathname.current = location.pathname
  }, [location])

  useEffect(() => {
    register({
      onUpdate: (wb) => {
        console.log('Update available!')
        updatedRef.current = wb
      },
    })
  }, [register])
  return (
    <context.Provider
      value={useMemo(
        () => ({
          updateAfterNavigate: () => {
            updateAfterNavigate.current = true
          },
        }),
        [],
      )}
    >
      {children}
    </context.Provider>
  )
}

export function useUpdateAfterNavigate() {
  return useContext(context).updateAfterNavigate
}
