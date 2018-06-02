import React from 'react'
import SongsContainer from 'containers/songs'
import Song from 'sections/song/song'

const PlaceholderSongList = () => <div>Načítám seznam písní</div>

const Print = () => (
  <SongsContainer placeholder={PlaceholderSongList}>
    {songs =>
      !songs.data ? null : (
        <div>
          {songs.data.songs.list.map(s => <Song key={s.id} id={s.id} />)}
        </div>
      )
    }
  </SongsContainer>
)
export default Print
