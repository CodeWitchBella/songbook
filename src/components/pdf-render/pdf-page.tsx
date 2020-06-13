import React, { PropsWithChildren, useContext } from 'react'
import { usePDFSettings } from './pdf-settings'
import ReactPDF, { View, Page } from '@react-pdf/renderer'
import { useIsInPDF } from './primitives'

const margin = {
  top: (7.8 / 148) * 100,
  bottom: (6 / 148) * 100,
  outer: (12.4 / 105) * 100,
  inner: (18.8 / 105) * 100,
}

function DefaultPage({ children }: PropsWithChildren<{}>) {
  const isInPDF = useIsInPDF()
  const pdfSettings = usePDFSettings()
  if (!isInPDF) return <NoopPage>{children}</NoopPage>
  return (
    <ReactPDF.Page wrap={false} size={`A${pdfSettings.pageSize}`}>
      {children}
    </ReactPDF.Page>
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
  style?: ReactPDF.Style | ReactPDF.Style[]
}>) {
  const { vw, vh, em } = usePDFSettings()
  const { Page } = useContext(pageContext)

  return (
    <Page>
      <View
        style={[
          style as any,
          {
            fontFamily: 'Cantarell',
            fontSize: em,
            fontWeight: 'normal',
            height: 100 * vh,
            width: 100 * vw,
            paddingTop: margin.top * vh,
            paddingBottom: margin.bottom * vh,
            paddingRight: left ? margin.inner * vw : margin.outer * vw,
            paddingLeft: left ? margin.outer * vw : margin.inner * vw,
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
  return <View style={{ width: 100 * vw, height: 100 * vh }}>{children}</View>
}

export function PDFBooklet({ pages }: { pages: JSX.Element[] }) {
  const pagesCp = [...pages]
  const realPages: (readonly [
    readonly [JSX.Element, JSX.Element],
    readonly [JSX.Element, JSX.Element],
  ])[] = []
  while (pagesCp.length > 0) {
    const a = [
      pagesCp.splice(pagesCp.length - 1, 1)[0],
      pagesCp.splice(0, 1)[0] || <PDFPage left={false} />,
    ] as const
    const b = [
      pagesCp.splice(0, 1)[0] || <PDFPage left={true} />,
      pagesCp.splice(pagesCp.length - 1, 1)[0] || <PDFPage left={false} />,
    ] as const
    realPages.push([a, b])
    realPages.push([a, b])
  }

  const { pageSize } = usePDFSettings()

  return (
    <pageContext.Provider value={{ Page: NoopPage }}>
      {realPages.map((page, i) => (
        <ReactPDF.Page
          key={i}
          size={`A${pageSize - 2}`}
          orientation="portrait"
          wrap={false}
        >
          <View
            style={{
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100vh',
              transform: i % 2 === 0 ? 'rotate(180deg)' : '',
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
            <View style={{ flexDirection: 'row', transform: 'rotate(180deg)' }}>
              {page[1]}
            </View>
          </View>
        </ReactPDF.Page>
      ))}
    </pageContext.Provider>
  )
}
