import React from 'react'
import Contents from 'sections/contents/contents'
import TitlePage from 'sections/title-page/title-page'
import { parseSong } from 'utils/song-parser/song-parser'
import { SongPage } from 'components/song-look/song-look'
import { useSongList, useSong } from 'store/store'
import { useTag } from 'store/fetchers'

function Song({ slug, number }: { slug: string; number: number }) {
  const { song } = useSong({ slug })
  if (!song) return null

  const parsed = parseSong('my', song.text)
  const content = parsed.map((page, i) => (
    <SongPage
      pageData={page}
      song={song}
      number={number + 1}
      pageNumber={number /* FIXME */}
      key={i}
    />
  ))
  return <React.Fragment>{content}</React.Fragment>
}

const Print = ({ tag }: { tag: string }) => {
  // TODO: use tag to filter songs
  const { songs: songList } = useSongList()
  const tagMeta = useTag()
  if (!tagMeta) return <div>Načítám...</div>

  return (
    <div>
      <TitlePage image={tagMeta.cover || undefined} />
      <main>
        {songList.map((song, i) => (
          <Song slug={song.item.slug} number={i} key={song.item.id} />
        ))}
      </main>
      <Contents
        list={songList.map((s) => ({
          text: s.item.text,
          author: s.item.author,
          title: s.item.title,
          id: s.item.id,
          metadata: s,
        }))}
        left
      />
    </div>
  )
}
export default Print
