import { useContext, useEffect, useMemo, useReducer, useCallback } from 'react'
// @ts-ignore
import { __RouterContext, RouteComponentProps } from 'react-router'
import useForceUpdate from './use-force-update'

/**
 * Use this only if you know what you are doing
 */
export function useRouterUnsafe<T = {}>(): RouteComponentProps<T> {
  return useContext(__RouterContext)
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
