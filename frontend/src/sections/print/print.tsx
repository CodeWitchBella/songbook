import React from 'react'
import SongsContainer from 'containers/songs'
import Song from 'sections/song/song'
import styled from 'react-emotion'
import Contents from 'sections/contents/contents'
import TitlePage from 'sections/title-page/title-page'

const PlaceholderSongList = () => <div>Načítám seznam písní</div>

const Print = ({ tag }: { tag: string }) => (
  <SongsContainer variables={{ tag }} placeholder={PlaceholderSongList}>
    {songs =>
      !songs.data ? null : (
        <div>
          <TitlePage />
          {songs.data.songs.list.map((s, i) => (
            <Song id={s.id} number={i + 1} key={s.id} />
          ))}
          <Contents list={songs.data.songs.list} />
        </div>
      )
    }
  </SongsContainer>
)
export default Print
