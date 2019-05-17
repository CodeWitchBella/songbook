import React from 'react'
import Contents from 'sections/contents/contents'
import TitlePage from 'sections/title-page/title-page'
import { parseSong } from 'utils/parse-song'
import { SongPage } from 'components/song-look/song-look'
import { useSongList, useSong } from 'store/store'
import { useTag } from 'store/fetchers'
import { notNull } from '@codewitchbella/ts-utils'

function Song({ name, number }: { name: string; number: number }) {
  const song = useSong(name)
  if (!song) return null
  const { longData: data } = song
  if (!song || !data) return null

  const parsed = parseSong(data.text)
  const content = parsed.map((page, i) => (
    <SongPage
      pageData={page}
      song={{ ...song, longData: data }}
      number={number + 1}
      pageNumber={number /* FIXME */}
      key={i}
    />
  ))
  return <React.Fragment>{content}</React.Fragment>
}

const Print = ({ tag }: { tag: string }) => {
  // TODO: use tag to filter songs
  const songList = useSongList()
  const tagMeta = useTag()
  if (!tagMeta) return <div>Načítám...</div>

  return (
    <div>
      <TitlePage image={tagMeta.cover || undefined} />
      <main>
        {songList.map((song, i) => (
          <Song name={song.id} number={i} key={song.id} />
        ))}
      </main>
      <Contents
        list={songList
          .map(s =>
            s.longData
              ? {
                  text: s.longData.text,
                  author: s.shortData.author,
                  title: s.shortData.title,
                  id: s.id,
                  metadata: s.longData,
                }
              : null,
          )
          .filter(notNull)}
        left
      />
    </div>
  )
}
export default Print
