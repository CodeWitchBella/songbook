import { BackArrow, BackButton } from 'components/back-button'
import { getChordDefinition } from 'components/chord-help'
import { RootView, TH2, TText } from 'components/themed'
import { useMemo } from 'react'
import { View } from 'react-native'
import { Link } from 'react-router-dom'
import { useSongList } from 'store/store'
import * as parser from 'utils/song-parser/song-parser'

const ignore = new Set([
  '|',
  '',
  'kapo',
  'repeat',
  'play',
  '|:',
  ':|',
  '...',
  '(brnk)',
])
export default function Chords() {
  const songs = useSongList()
  const unknownChords = useMemo(() => {
    const ret = new Map<string, Set<string>>()
    for (const s of songs.songs) {
      const parsed = parser
        .parseSong('my', s.item.text, { continuous: 'always' })
        .pages.concat(
          parser.parseSong('my', s.item.text, { continuous: 'never' }).pages,
        )
      for (const page of parsed) {
        for (const paragraph of page) {
          for (const line of paragraph) {
            for (const part of line.content) {
              if (part.ch) {
                for (const chord of part.ch.replace(/^_/, '').split(' ')) {
                  const ch = chord.replace(/,$/, '').trim()
                  if (
                    !getChordDefinition(ch).def &&
                    !ignore.has(ch) &&
                    !/^[0-9]/.test(ch) &&
                    !/^\(?x[0-9]/.test(ch)
                  ) {
                    if (!ret.has(ch)) ret.set(ch, new Set())
                    ret.get(ch)!.add(s.item.slug)
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
      .map((key) => ({
        chord: key,
        slugs: Array.from(ret.get(key)?.values() || []),
      }))
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
        {unknownChords.map(({ chord, slugs }) => (
          <TText key={chord}>
            {JSON.stringify(chord)}{' '}
            <View>
              {slugs.map((slug) => (
                <Link to={'/song/' + slug}>{slug}</Link>
              ))}
            </View>
          </TText>
        ))}
      </View>
    </RootView>
  )
}
