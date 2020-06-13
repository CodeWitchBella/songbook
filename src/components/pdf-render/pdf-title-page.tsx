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
          height: 30 * em,
        }}
      >
        <Image source={image} style={{ width: 20 * em }} />
      </View>
      <View
        style={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ paddingBottom: 1.5 * em }}>
          <Text style={{ fontSize: 3 * em }}>{title}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 2 * em }}>
            {DateTime.local().toFormat('d. M. yyyy')}
          </Text>
        </View>
      </View>
    </PDFPage>
  )
}
