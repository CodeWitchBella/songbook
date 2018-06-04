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
      !songs.data ? null : (
        <div>
          <TitlePage />
          {songs.data.songs.list
            .map((song, number) => ({
              data: song,
              parsed: parseSong(song.textWithChords),
              number,
            }))
            .reduce(
              (prev, cur) =>
                prev.concat(
                  cur.parsed.map(page => ({
                    data: cur.data,
                    page,
                    number: cur.number,
                  })),
                ),
              [] as { data: SongType; page: Paragraph[]; number: number }[],
            )
            .map((s, i) => (
              <SongPage
                pageData={s.page}
                song={s.data}
                number={s.number + 1}
                pageNumber={i}
                key={s.data.id}
              />
            ))}
          <Contents list={songs.data.songs.list} />
        </div>
      )
    }
  </SongsWithTextContainer>
)
export default Print
