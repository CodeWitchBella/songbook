import React, { useContext, useMemo, PropsWithChildren } from 'react'

type CtxIn = {
  fontSize: number
  paragraphSpace: number
  titleSpace: number
  pageSize: number
  web: boolean
  transpose: number
}
type Ctx = CtxIn & {
  em: (v: number) => number
  vw: (v: number) => number
  vh: (v: number) => number
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
  const {
    fontSize = 1,
    paragraphSpace = 1,
    titleSpace = 1,
    pageSize = 6,
    web = false,
    transpose = 0,
  } = {
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
          em: (v): any => (web ? `${v}em` : v * em),
          vw: (v): any =>
            web
              ? `calc(${v} * var(--vw))`
              : v * (aSizes[pageSize][0] / 100) * 2.8346438836889, // mm to pt
          vh: (v): any =>
            web
              ? `calc(${v} * var(--vh))`
              : v * (aSizes[pageSize][1] / 100) * 2.8346438836889, // mm to pt
          web,
          transpose,
        }),
        [em, fontSize, pageSize, paragraphSpace, titleSpace, web, transpose],
      )}
    >
      {props.children}
    </settingsCtx.Provider>
  )
}
