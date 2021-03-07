import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type Setter = (
  value: string | null,
  opts?: { push?: boolean; state?: any },
) => void
export function useQueryParam(param: string): [string | null, Setter] {
  const location = useLocation()
  const navigate = useNavigate()

  const setValueOnRouter = useCallback<Setter>(
    (
      value,
      {
        push = false,
        state: locationState,
      }: { push?: boolean; state?: any } = {},
    ) => {
      const params = new URLSearchParams(location.search)
      if (value !== null) params.set(param, value)
      else params.delete(param)
      params.sort()

      const nextState =
        locationState === undefined ? location.state : locationState
      const search = params.toString()

      navigate(location.pathname + (search ? '?' + search : ''), {
        replace: !push,
        state: nextState,
      })
    },
    [param, location, navigate],
  )

  return [
    new URLSearchParams(location.search).get(param) ?? null,
    setValueOnRouter,
  ]
}
