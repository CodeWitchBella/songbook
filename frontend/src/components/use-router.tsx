import {
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react'
// @ts-ignore
import { __RouterContext, RouteComponentProps } from 'react-router'
import useForceUpdate from './use-force-update'

/**
 * Use this only if you know what you are doing
 */
export function useRouterUnsafe<T = {}>(): RouteComponentProps<T> {
  return useContext(__RouterContext as any)
}

export default function useRouter() {
  const forceUpdate = useForceUpdate()
  const routerContext = useRouterUnsafe()

  // we need this to force update when location changes but routerContext
  // identity stays same
  useEffect(() => {
    return routerContext.history.listen(forceUpdate)
  }, [forceUpdate, routerContext])
  return routerContext
}

export function useHistoryChange() {
  const { history } = useRouterUnsafe()
  return useMemo(
    () => ({
      push: (path: string, state?: any) => history.push(path, state),
      replace: (path: string, state?: any) => history.replace(path, state),
    }),
    [history],
  )
}

type Setter = (
  value: string | null,
  opts?: { push?: boolean; state?: any },
) => void
export function useQueryParam(param: string): [string | null, Setter] {
  const router = useRouterUnsafe()
  const [value, setValue] = useState(() =>
    new URLSearchParams(router.location.search).get(param),
  )
  const scheduled = useRef([] as (string | null)[])

  useEffect(() => {
    return router.history.listen(location => {
      const value = new URLSearchParams(location.search).get(param) || ''
      if (scheduled.current.includes(value)) {
        scheduled.current.splice(scheduled.current.indexOf(value), 1)
      } else {
        setImmediate(() => {
          setValue(value)
        })
      }
    })
  }, [param, router.history])

  const setValueOnRouter = useCallback<Setter>(
    (
      value,
      {
        push = false,
        state: locationState,
      }: { push?: boolean; state?: any } = {},
    ) => {
      const params = new URLSearchParams(router.location.search)
      if (value !== null) params.set(param, value)
      else params.delete(param)
      params.sort()
      const state = {
        ...router.location,
        state:
          locationState === undefined ? router.location.state : locationState,
        search: params.toString(),
      }
      setValue(value)
      scheduled.current.push(value)
      if (push) router.history.push(state)
      else router.history.replace(state)
    },
    [param, router.history, router.location],
  )

  return [value, setValueOnRouter]
}
