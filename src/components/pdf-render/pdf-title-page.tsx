import React from 'react'
import { usePDFSettings } from './pdf-settings'
import { View, Image, Text } from './primitives'
import { DateTime } from 'luxon'
import { PDFPage } from './pdf-page'
import image from './cross.png'

export function PDFTitlePage({ title }: { title: string }) {
  const { em } = usePDFSettings()
  return (
    <PDFPage left={false}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: em(30),
        }}
      >
        <Image source={image} style={{ width: em(20) }} />
      </View>
      <View
        style={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ paddingBottom: em(1.5) }}>
          <Text style={{ fontSize: em(3) }}>{title}</Text>
        </View>
        <View>
          <Text style={{ fontSize: em(2) }}>
            {DateTime.local().toFormat('d. M. yyyy')}
          </Text>
        </View>
      </View>
    </PDFPage>
  )
}
