import { useContext, useCallback } from 'react'
import { __RouterContext } from 'react-router'

function useRouterUnsafe() {
  return useContext(__RouterContext)
}
export function useNavigate() {
  const { history } = useRouterUnsafe()
  return useCallback(
    (
      to: string,
      { state = {}, replace = false }: { state?: any; replace?: boolean } = {},
    ) => {
      if (replace) history.replace(to, state)
      else history.push(to, state)
    },
    [history],
  )
}
