import React, { useContext, useMemo, PropsWithChildren } from 'react'
import { IsInPDFProvider } from './primitives'

type CtxIn = {
  fontSize: number
  paragraphSpace: number
  titleSpace: number
  pageSize: number
}
type Ctx = CtxIn & {
  em: number
  vw: number
  vh: number
}
const settingsCtx = React.createContext(null as null | Ctx)
export function usePDFSettings() {
  const ret = useContext(settingsCtx)
  if (!ret) throw new Error('No context provider')
  return ret
}

const aSizes = [
  [841, 1189],
  [594, 841],
  [420, 594],
  [297, 420],
  [210, 297],
  [148, 210],
  [105, 148],
  [74, 105],
  [52, 74],
  [37, 52],
]

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
          vw: (aSizes[pageSize][0] / 100) * 2.8346438836889, // mm to pt
          vh: (aSizes[pageSize][1] / 100) * 2.8346438836889, // mm to pt
        }),
        [em, fontSize, pageSize, paragraphSpace, titleSpace],
      )}
    >
      {props.children}
    </settingsCtx.Provider>
  )
}
