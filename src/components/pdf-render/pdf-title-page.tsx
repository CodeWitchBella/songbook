import React from 'react'
import { usePDFSettings } from './pdf-settings'
import { View, Image, Text } from './primitives'
import { DateTime } from 'luxon'
import { PDFPage } from './pdf-page'
import image from './cross.png'
import { getSongbookMeta } from './songbook-meta'

export function PDFTitlePage({ title }: { title: string }) {
  const { em, vh } = usePDFSettings()
  const meta = getSongbookMeta(title, DateTime.utc())
  if (meta.imageOnly) {
    return (
      <PDFPage left={false}>
        <View
          style={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={image} style={{ height: vh(90), width: vh(63) }} />
        </View>
      </PDFPage>
    )
  }
  return (
    <PDFPage left={false}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: em(meta.imageViewHeight),
          paddingTop: em(meta.imageViewPaddingTop),
        }}
      >
        <Image
          source={image}
          style={meta.imageWidth ? { width: em(meta.imageWidth) } : {}}
        />
      </View>
      <View
        style={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ paddingBottom: em(1.5) }}>
          <Text style={{ fontSize: em(3) }}>{meta.title}</Text>
        </View>
        <View>
          <Text style={{ fontSize: em(2) }}>{meta.subtitle}</Text>
        </View>
      </View>
    </PDFPage>
  )
}
