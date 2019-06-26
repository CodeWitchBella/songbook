import React, { PropsWithChildren } from 'react'
import { usePDFSettings } from './pdf-settings'
import ReactPDF, { Page, View } from '@react-pdf/renderer'

const pageValues = {
  width: 105,
  height: 148,

  margin: {
    top: (7.8 / 148) * 100,
    bottom: (6 / 148) * 100,
    outer: (12.4 / 105) * 100,
    inner: (18.8 / 105) * 100,
  },
  innerRatio: (105 - 12.4 - 18.8) / (148 - 6 - 7.8),
}

export function PDFPage({
  children,
  left,
  style,
}: PropsWithChildren<{
  left: boolean
  style?: ReactPDF.Style | ReactPDF.Style[]
}>) {
  const { em, percent, pageSize } = usePDFSettings()
  return (
    <Page
      wrap={false}
      style={{
        fontFamily: 'Cantarell',
        fontSize: em,
        fontWeight: 'normal',
      }}
      size={`A${pageSize}`}
    >
      <View
        style={[
          style,
          {
            height: '100%',
            paddingTop: pageValues.margin.top * percent,
            paddingBottom: pageValues.margin.bottom * percent,
            paddingRight: left
              ? pageValues.margin.inner * percent
              : pageValues.margin.outer * percent,
            paddingLeft: left
              ? pageValues.margin.outer * percent
              : pageValues.margin.inner * percent,
          },
        ]}
      >
        {children}
      </View>
    </Page>
  )
}
