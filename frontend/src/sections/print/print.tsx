import React from 'react'
import styled from 'react-emotion'
import Contents from 'sections/contents/contents'
import TitlePage from 'sections/title-page/title-page'
import { parseSong, Paragraph } from 'utils/parse-song'
import SongsWithTextContainer, {
  Song as SongType,
} from 'containers/songs-with-text'
import { SongPage } from 'components/song-look/song-look'
import { AudioProvider } from 'components/song-look/audio-player'

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
              .map(cur => {
                const content = cur.parsed
                  .map((page, i) => ({
                    data: cur.data,
                    page,
                    number: cur.number,
                    key: `${cur.data.id}-${i}`,
                  }))
                  .map((s, i) => (
                    <SongPage
                      pageData={s.page}
                      song={s.data}
                      number={s.number + 1}
                      pageNumber={i + 1}
                      key={s.key}
                    />
                  ))
                if (cur.data.metadata.audio) {
                  return (
                    <AudioProvider
                      key={cur.data.id}
                      src={cur.data.metadata.audio}
                    >
                      {content}
                    </AudioProvider>
                  )
                }
                return (
                  <React.Fragment key={cur.data.id}>{content}</React.Fragment>
                )
              })

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
