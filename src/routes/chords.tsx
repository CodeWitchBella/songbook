import { BackArrow, BackButton } from 'components/back-button'
import { RootView, TH2, TText } from 'components/themed'
import { useMemo } from 'react'
import { View } from 'react-native'
import * as parser from 'utils/song-parser/song-parser'
import { useSongList } from 'store/store'
import { getChordDefinition } from 'components/chord-help'

export default function Chords() {
  const songs = useSongList()
  const unknownChords = useMemo(() => {
    const ret = new Map<string, string>()
    for (const s of songs.songs) {
      const parsed = parser.parseSong('my', s.item.text)
      for (const page of parsed) {
        for (const paragraph of page) {
          for (const line of paragraph) {
            for (const part of line.content) {
              if (part.ch) {
                for (const chord of part.ch.replace(/^_/, '').split(' ')) {
                  const ch = chord.replace(/,$/, '')
                  if (!getChordDefinition(ch) && ch) {
                    ret.set(ch, s.item.slug)
                  }
                }
              }
            }
          }
        }
      }
    }
    return Array.from(ret.keys())
      .sort()
      .map((key) => ({ chord: key, slug: ret.get(key) }))
  }, [songs.songs])
  return (
    <RootView style={{ justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: 500,
          maxWidth: '100%',
          paddingHorizontal: 4,
          paddingBottom: 8,
        }}
      >
        <TH2>
          <BackButton>
            <BackArrow />
          </BackButton>
          Unknown chords
        </TH2>
        {unknownChords.map(({ chord, slug }) => (
          <TText key={chord}>
            {JSON.stringify(chord)} ({chord.length}) {slug}
          </TText>
        ))}
      </View>
    </RootView>
  )
}
