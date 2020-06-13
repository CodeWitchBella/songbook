import React, { createContext, useContext, PropsWithChildren } from 'react'
import { View as RNView, Text as RNText, Image as RNImage } from 'react-native'
import {
  View as PDFView,
  Text as PDFText,
  Image as PDFImage,
} from '@react-pdf/renderer'

const isInPdfCtx = createContext(false)

type PropsOf<
  T extends React.ComponentType<any>
> = T extends React.ComponentType<infer P> ? P : never

export const View = merge('View', PDFView, RNView)
export const Text = merge('Text', PDFText, RNText)
export function Image(
  props: Omit<
    PropsOf<typeof PDFImage> & PropsOf<typeof RNImage>,
    'src' | 'source'
  > & { source: string },
) {
  if (useIsInPDF()) return <PDFImage {...props} />
  const { source, ...rest } = props
  return <RNImage source={{ uri: source }} {...rest} />
}

export function IsInPDFProvider({ children }: PropsWithChildren<{}>) {
  return <isInPdfCtx.Provider value={true}>{children}</isInPdfCtx.Provider>
}

export function useIsInPDF() {
  return useContext(isInPdfCtx)
}

function merge<
  PDF extends React.ComponentType<any>,
  RN extends React.ComponentType<any>
>(name: string, PDF: PDF, RN: RN) {
  function Merged(props: PropsOf<PDF> & PropsOf<RN>) {
    if (useIsInPDF()) return <PDF {...(props as any)} />
    return <RN {...(props as any)} />
  }
  Merged.displayName = name
  return Merged
}
