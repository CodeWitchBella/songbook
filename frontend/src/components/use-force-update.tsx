import { useCallback, useReducer } from 'react'

export default function useForceUpdate() {
  const [, dispatch] = useReducer((state, _action: null) => !state, true)
  return useCallback(() => dispatch(null), [])
}
