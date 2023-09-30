import type { PropsWithChildren } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { useUpdateAfterNavigate } from './service-worker-status'

export function useGoBack(to = '/') {
  const navigate = useNavigate()
  const location = useLocation()
  const updateAfterNavigate = useUpdateAfterNavigate()
  return () => {
    const canGoBack = location.state && (location.state as any).canGoBack
    updateAfterNavigate()
    if (canGoBack) {
      navigate(typeof canGoBack === 'number' ? -canGoBack : -1)
    } else {
      navigate(to, { replace: true })
      navigate(location.pathname + location.search + location.hash, {
        state: location.state,
      })
      navigate(-1)
    }
  }
}

export function BackButton({
  children,
  to = '/',
  className,
}: PropsWithChildren<{
  to?: string
  className?: string
}>) {
  return (
    <button onClick={useGoBack(to)} className={className}>
      {children}
    </button>
  )
}

export function BackArrow({ height }: { height?: number | string }) {
  return (
    <svg viewBox="0 0 5.443 4.692" height={height ?? '13'}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth=".7"
        strokeLinecap="round"
      >
        <path d="M.907 2.346h4.236" />
        <path d="M2.276.3L.3 2.346l1.976 2.046" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
