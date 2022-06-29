import React from 'react'
import { PDFPage } from './pdf-page'
import { View } from './primitives'
import { usePDFSettings } from './pdf-settings'
const Link: typeof import('@react-pdf/renderer').Link = 'LINK' as any

export function PDFToc({
  list,
  idToCounter = new Map(),
}: {
  list: { title: string; author: string; id: string; text: string }[]
  idToCounter?: Map<string, number>
}) {
  const { em } = usePDFSettings()
  let page = 1
  return (
    <PDFPage
      left={true}
      style={{
        flexDirection: 'column',
        flexWrap: 'wrap',
      }}
    >
      <View
        style={{
          maxHeight: '100%',
          flexDirection: 'column',
          flexWrap: 'wrap',
          paddingTop: em(2.65),
          paddingRight: em(-0.2),
          paddingBottom: em(1),
        }}
      >
        <View style={{ height: em(6.7 - 2.65), width: 0 }} />
        {list.map((song, i) => {
          const link = page
          page += song.text.split('--- page break ---').length
          return (
            <View
              key={i}
              style={{
                maxWidth: '50%',
                paddingBottom: em(0.1),
                paddingRight: em(0.2),
              }}
            >
              <Link
                src={link as any}
                style={{
                  fontSize: em(0.8),
                  textDecoration: 'none',
                  color: 'black',
                }}
              >
                {idToCounter.get(song.id) || i + 1}. {song.title}{' '}
                {`(${song.author})`}
              </Link>
            </View>
          )
        })}
      </View>
    </PDFPage>
  )
}
