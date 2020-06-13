import React from 'react'
import { PDFPage } from './pdf-page'
import { View, Text } from './primitives'
import { usePDFSettings } from './pdf-settings'

export function PDFToc({
  list,
  idToCounter = new Map(),
}: {
  list: { title: string; author: string; id: string }[]
  idToCounter?: Map<string, number>
}) {
  const { em } = usePDFSettings()
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
        {list.map((song, i) => (
          <View
            key={i}
            style={{
              maxWidth: '50%',
              paddingBottom: em(0.1),
              paddingRight: em(0.2),
            }}
          >
            <Text style={{ fontSize: em(0.8) }}>
              {idToCounter.get(song.id) || i + 1}. {song.title}{' '}
              {`(${song.author})`}
            </Text>
          </View>
        ))}
      </View>
    </PDFPage>
  )
}
