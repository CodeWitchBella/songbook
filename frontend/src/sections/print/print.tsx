import React from 'react'
import SongsContainer from 'containers/songs'
import Song from 'sections/song/song'
import styled from 'react-emotion'

const PlaceholderSongList = () => <div>Načítám seznam písní</div>

const Print = ({ tag }: { tag: string }) => (
  <SongsContainer variables={{ tag }} placeholder={PlaceholderSongList}>
    {songs =>
      !songs.data ? null : (
        <div>
          {songs.data.songs.list.map((s, i) => (
            <Song id={s.id} number={i + 1} key={s.id} />
          ))}
        </div>
      )
    }
  </SongsContainer>
)
export default Print
