import React, { PropsWithChildren, useContext } from 'react'
import { usePDFSettings } from './pdf-settings'
import { useIsInPDF, PDFPage as PrimitivePDFPage, View } from './primitives'
import SizerPage from '../sizer-page'
import type { Style } from '@react-pdf/types'

const margin = {
  top: (7.8 / 148) * 100,
  bottom: (6 / 148) * 100,
  outer: (12.4 / 105) * 100,
  inner: (18.8 / 105) * 100,
}

function DefaultPage({ children }: PropsWithChildren<{}>) {
  const isInPDF = useIsInPDF()
  const pdfSettings = usePDFSettings()
  if (!isInPDF) return <SizerPage>{children}</SizerPage>
  return (
    <PrimitivePDFPage wrap={false} size={`A${pdfSettings.pageSize}` as any}>
      {children}
    </PrimitivePDFPage>
  )
}

const pageContext = React.createContext({
  Page: DefaultPage,
})

export function PDFPage({
  children,
  left,
  style,
}: PropsWithChildren<{
  left: boolean
  style?: Style
}>) {
  const { vw, vh, web } = usePDFSettings()
  const { Page } = useContext(pageContext)

  return (
    <Page>
      <View
        style={[
          style as any,
          {
            fontFamily: 'Cantarell',
            fontWeight: 'normal',
            height: web ? '100%' : vh(100),
            width: web ? '100%' : vw(100),
            paddingTop: web ? 0 : vh(margin.top),
            paddingBottom: web ? 0 : vh(margin.bottom),
            paddingRight: web ? 0 : vw(left ? margin.inner : margin.outer),
            paddingLeft: web ? 0 : vw(left ? margin.outer : margin.inner),
          },
        ]}
      >
        {children}
      </View>
    </Page>
  )
}

function NoopPage({ children }: PropsWithChildren<{}>) {
  const { vw, vh } = usePDFSettings()
  return <View style={{ width: vw(100), height: vh(100) }}>{children}</View>
}

export function PDFBooklet({ pages }: { pages: JSX.Element[] }) {
  const pagesCp = [...pages]
  const realPages: (readonly [
    readonly [JSX.Element, JSX.Element],
    readonly [JSX.Element, JSX.Element],
  ])[] = []
  let keygen = 0
  while (pagesCp.length > 0) {
    const a = [
      pagesCp.splice(pagesCp.length - 1, 1)[0],
      pagesCp.splice(0, 1)[0] || (
        <PDFPage left={false} key={`booklet-${keygen++}`} />
      ),
    ] as const
    const b = [
      pagesCp.splice(0, 1)[0] || <PDFPage left={true} />,
      pagesCp.splice(pagesCp.length - 1, 1)[0] || (
        <PDFPage left={false} key={`booklet-${keygen++}`} />
      ),
    ] as const
    realPages.push([a, b])
    realPages.push([a, b])
  }

  const { pageSize } = usePDFSettings()

  return (
    <pageContext.Provider value={{ Page: NoopPage }}>
      {realPages.map((page, i) => (
        <PrimitivePDFPage
          key={i}
          size={`A${pageSize - 2}` as any}
          orientation="portrait"
          wrap={false}
        >
          <View
            style={{
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100vh',
              transform: i % 2 === 0 ? [{ rotate: '180deg' }] : [],
              flexWrap: 'wrap',
            }}
          >
            <View style={{ flexDirection: 'row' }}>{page[0]}</View>
            <View
              style={{
                borderBottomWidth: 0.1,
                borderStyle: 'dashed',
                borderColor: 'gray',
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                transform: [{ rotate: '180deg' }],
              }}
            >
              {page[1]}
            </View>
          </View>
        </PrimitivePDFPage>
      ))}
    </pageContext.Provider>
  )
}
