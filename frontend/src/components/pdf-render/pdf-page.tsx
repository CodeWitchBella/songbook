import React, { PropsWithChildren, useContext } from 'react'
import { usePDFSettings } from './pdf-settings'
import ReactPDF, { View } from '@react-pdf/renderer'

const margin = {
  top: (7.8 / 148) * 100,
  bottom: (6 / 148) * 100,
  outer: (12.4 / 105) * 100,
  inner: (18.8 / 105) * 100,
}

function DefaultPage({ children }: PropsWithChildren<{}>) {
  return (
    <ReactPDF.Page
      wrap={false}
      size={`A${usePDFSettings().pageSize}`}
      style={{ transform: [{ scale: 2 }] }}
    >
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
          style,
          {
            fontFamily: 'Cantarell',
            fontSize: em,
            fontWeight: 'normal',
            height: '100%',
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
  return <View style={{ width: '50vw', height: '100vh' }}>{children}</View>
}

export function PDFBooklet({ pages }: { pages: JSX.Element[] }) {
  const pagesCp = [...pages]
  const realPages: JSX.Element[][] = []
  while (pagesCp.length > 0) {
    realPages.push(pagesCp.splice(0, 2))
  }

  const { pageSize } = usePDFSettings()

  return (
    <pageContext.Provider value={{ Page: NoopPage }}>
      {realPages.map((page, i) => (
        <ReactPDF.Page
          key={i}
          size={`A${pageSize + 1}`}
          orientation="landscape"
        >
          <View style={{ flexDirection: 'row' }}>{page}</View>
        </ReactPDF.Page>
      ))}
    </pageContext.Provider>
  )
}
