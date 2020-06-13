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
          paddingTop: 2.65 * em,
          paddingRight: -0.2 * em,
          paddingBottom: 1 * em,
        }}
      >
        <View style={{ height: (6.7 - 2.65) * em, width: 0 }} />
        {list.map((song, i) => (
          <View
            key={i}
            style={{
              maxWidth: '50%',
              paddingBottom: 0.1 * em,
              paddingRight: 0.2 * em,
            }}
          >
            <Text style={{ fontSize: 0.8 * em }}>
              {idToCounter.get(song.id) || i + 1}. {song.title}{' '}
              {`(${song.author})`}
            </Text>
          </View>
        ))}
      </View>
    </PDFPage>
  )
}
