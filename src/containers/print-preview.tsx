import React, {
  useContext,
  useMemo,
  useCallback,
  PropsWithChildren,
  useState,
} from 'react'

const context = React.createContext({
  value: false,
  set: (val: boolean | ((v: boolean) => boolean)) => {},
})

export function PrintPreviewProvider({ children }: PropsWithChildren<{}>) {
  const [value, set] = useState(false)
  const ctx = useMemo(() => ({ value, set }), [value])
  return <context.Provider value={ctx}>{children}</context.Provider>
}

export const usePrintPreview = () => useContext(context).value

export const usePrintPreviewToggle = () => {
  const ctx = useContext(context)
  const toggle = useCallback(() => ctx.set((v) => !v), [ctx])
  return useMemo(() => [ctx.value, toggle] as [boolean, () => void], [
    ctx.value,
    toggle,
  ])
}
