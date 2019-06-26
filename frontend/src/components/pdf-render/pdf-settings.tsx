import React, { useContext, useMemo, PropsWithChildren } from 'react'

type Ctx = {
  em: number
  fontSize: number
  paragraphSpace: number
  titleSpace: number
}
const settingsCtx = React.createContext(null as null | Ctx)
export function usePDFSettings() {
  const ctx = useContext(settingsCtx)

  const noCtx = ctx === null
  const { em, fontSize, paragraphSpace, titleSpace } = ctx || {
    em: 0,
    fontSize: 0,
    paragraphSpace: 0,
    titleSpace: 0,
  }

  const ret = useMemo(
    () =>
      noCtx
        ? null
        : {
            em,
            fontSize,
            paragraphSpace,
            titleSpace,
            percent: em / 2.54,
          },
    [em, fontSize, noCtx, paragraphSpace, titleSpace],
  )
  if (!ret) throw new Error('Unknown em')
  return ret
}

export const PDFSettingsProvider = settingsCtx.Provider

export function PDFSettingsProviderMerge(
  props: PropsWithChildren<{ value: Partial<Ctx> }>,
) {
  const ctx = useContext(settingsCtx)
  if (!ctx) throw new Error('Merge provider must have provider as parent')
  return (
    <settingsCtx.Provider
      value={useMemo(() => ({ ...ctx, ...props.value }), [ctx, props.value])}
    >
      {props.children}
    </settingsCtx.Provider>
  )
}
