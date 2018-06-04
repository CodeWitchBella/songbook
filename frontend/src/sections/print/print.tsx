import React from 'react'
import styled from 'react-emotion'
import Contents from 'sections/contents/contents'
import TitlePage from 'sections/title-page/title-page'
import { parseSong, Paragraph } from 'utils/parse-song'
import SongsWithTextContainer, {
  Song as SongType,
} from 'containers/songs-with-text'
import { SongPage } from 'components/song-look/song-look'

const PlaceholderSongList = () => <div>Načítám seznam písní</div>

const Print = ({ tag }: { tag: string }) => (
  <SongsWithTextContainer variables={{ tag }} placeholder={PlaceholderSongList}>
    {songs =>
      !songs.data
        ? null
        : (() => {
            const pages = songs.data.songs.list
              .map((song, number) => ({
                data: song,
                parsed: parseSong(song.textWithChords),
                number,
              }))
              .reduce(
                (prev, cur) =>
                  prev.concat(
                    cur.parsed.map((page, i) => ({
                      data: cur.data,
                      page,
                      number: cur.number,
                      key: `${cur.data.id}-${i}`,
                    })),
                  ),
                [] as {
                  data: SongType
                  page: Paragraph[]
                  number: number
                  key: string
                }[],
              )
              .map((s, i) => (
                <SongPage
                  pageData={s.page}
                  song={s.data}
                  number={s.number + 1}
                  pageNumber={i + 1}
                  key={s.key}
                />
              ))
            return (
              <div>
                <TitlePage />
                <main>{pages}</main>
                <Contents
                  list={songs.data.songs.list}
                  left={pages.length % 2 !== 0}
                />
              </div>
            )
          })()
    }
  </SongsWithTextContainer>
)
export default Print
