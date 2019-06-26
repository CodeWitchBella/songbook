import React, { useContext, useMemo, PropsWithChildren } from 'react'

type CtxIn = {
  fontSize: number
  paragraphSpace: number
  titleSpace: number
  pageSize: number
}
type Ctx = CtxIn & {
  em: number
  percent: number
}
const settingsCtx = React.createContext(null as null | Ctx)
export function usePDFSettings() {
  const ret = useContext(settingsCtx)
  if (!ret) throw new Error('No context provider')
  return ret
}

export function PDFSettingsProvider(
  props: PropsWithChildren<{ value: Partial<CtxIn> }>,
) {
  const { fontSize = 1, paragraphSpace = 1, titleSpace = 1, pageSize = 6 } = {
    ...(useContext(settingsCtx) || {}),
    ...props.value,
  }
  const em = 7.2 * Math.sqrt(2) ** (6 - pageSize)

  return (
    <settingsCtx.Provider
      value={useMemo(
        () => ({
          fontSize,
          paragraphSpace,
          titleSpace,
          pageSize,
          em,
          percent: em / 2.54,
        }),
        [em, fontSize, pageSize, paragraphSpace, titleSpace],
      )}
    >
      {props.children}
    </settingsCtx.Provider>
  )
}
