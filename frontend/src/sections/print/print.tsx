import React from 'react'
import Contents from 'sections/contents/contents'
import TitlePage from 'sections/title-page/title-page'
import { parseSong, Paragraph } from 'utils/parse-song'
import { SongPage } from 'components/song-look/song-look'
import { AudioProvider } from 'components/song-look/audio-player'
import { useSongList } from 'store/list-provider'
import { useSong } from 'store/song-provider'
import { useTag } from 'store/fetchers'

function Song({
  name,
  number,
  lastModified,
}: {
  name: string
  number: number
  lastModified: number
}) {
  const { value } = useSong(name, lastModified)
  if (!value) return null
  const parsed = parseSong(value.textWithChords)
  const content = parsed.map((page, i) => (
    <SongPage
      pageData={page}
      song={{
        title: value.title,
        metadata: value.metadata,
        id: value.id,
        author: value.author,
      }}
      number={number + 1}
      pageNumber={number /* FIXME */}
      key={i}
    />
  ))
  if (value.metadata.audio) {
    return (
      <AudioProvider key={value.id} src={value.metadata.audio}>
        {content}
      </AudioProvider>
    )
  }
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
          <Song
            name={song.name}
            lastModified={song.lastModified}
            number={i}
            key={i}
          />
        ))}
      </main>
      <Contents list={songList as any /* FIXME */} left />
    </div>
  )
}
export default Print
