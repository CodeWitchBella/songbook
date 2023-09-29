import { buildData } from 'build-data'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { Linking, Pressable } from 'react-native'

import { TText } from './themed'

export function Version() {
  const [t] = useTranslation()
  return (
    <TText>
      {t('Current version')}
      {': '}
      <Pressable
        onPress={() => {
          Linking.openURL('https://github.com/CodeWitchBella/songbook')
        }}
      >
        <TText style={buildData.fallback ? { fontStyle: 'italic' } : {}}>
          {format(buildData.commitTime)}
        </TText>
      </Pressable>
    </TText>
  )
}

function format(date: string) {
  let dt = DateTime.fromISO(date)
  if (!dt.isValid) dt = DateTime.local()
  return dt.setZone(DateTime.local().zone).toFormat('d. M. yyyy HH:mm:ss')
}
