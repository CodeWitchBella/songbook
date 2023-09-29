import React, { useContext, useEffect, useMemo, useRef } from 'react'
import type { ServiceWorkerRegisterConfig } from 'serviceWorker'
import type { Workbox } from 'workbox-window'

const context = React.createContext({
  updateAfterNavigate: () => {},
  routeRendered: () => {},
})

export function ServiceWorkerStatusProvider({
  children,
  register,
}: {
  children: React.ReactNode
  register: (config?: ServiceWorkerRegisterConfig) => void
}) {
  const updatedRef = useRef(null as null | Workbox)
  const updateAfterNavigate = useRef(false)

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
            console.log('ServiceWorkerStatusProvider:updateAfterNavigate')
            updateAfterNavigate.current = true
          },
          routeRendered: () => {
            console.log('ServiceWorkerStatusProvider:routeRendered')
            const updated = updatedRef.current
            if (updated) {
              setTimeout(() => {
                updated.messageSW({ type: 'SKIP_WAITING' })
              }, 10)
            }
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

export function RouteRenderedMarker() {
  const { routeRendered } = useContext(context)
  useEffect(() => {
    routeRendered()
  }, [routeRendered])
  return null
}
