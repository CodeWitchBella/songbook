import { buildData } from 'build-data'
import { DateTime } from 'luxon'
import { Pressable, Linking } from 'react-native'
import { TText } from './themed'

export function Version() {
  return (
    <TText>
      Aktuální verze:{' '}
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
