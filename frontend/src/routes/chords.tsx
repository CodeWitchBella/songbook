import { getChordDefinition } from 'components/chord-help'
import { PageHeader } from 'components/page-header'
import { TText } from 'components/themed'
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
    <div className="mx-auto flex w-full max-w-lg flex-col px-1 py-2">
      <PageHeader>Unknown chords</PageHeader>
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
    </div>
  )
}
