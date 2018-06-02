import React from 'react'
import SongsContainer, { Song as SongType } from 'containers/songs'

const Placeholder = () => <div>Načítám seznam písní</div>

const Song = ({ song }: { song: SongType }) => (
  <div>
    <a href={`/song/${song.id}`}>
      {song.title} - {song.author}
    </a>
  </div>
)

const SongList = () => (
  <SongsContainer placeholder={Placeholder}>
    {songs =>
      !songs.data ? null : (
        <div>
          {songs.data.songs.list.map(s => <Song key={s.id} song={s} />)}
        </div>
      )
    }
  </SongsContainer>
)
export default SongList
