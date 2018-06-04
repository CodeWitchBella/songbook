import React from 'react'
import SongsContainer, { Song as SongType } from 'containers/songs'
import { css } from 'react-emotion'

const Placeholder = () => <div>Načítám seznam písní</div>

const listContainer = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin: 0px auto;
  flex-direction: row;
`

const a = css`
  color: black;
  text-decoration: none;
  :hover {
    text-decoration: underline;
  }
`

const songClass = css`
  font-size: 20px;
  width: 400px;

  a {
    display: inline-block;
    padding: 10px;
    color: black;
    ${a};
  }
`

const print = css`
  display: flex;
  font-size: 20px;
  height: 100px;
  align-items: center;
  justify-content: center;
  ${a};
`

const page = css`
  height: 100%;
`

const Song = ({ song }: { song: SongType }) => (
  <div className={songClass}>
    <a href={`/song/${song.id}`}>
      {song.title} - {song.author}
    </a>
  </div>
)

const SongList = ({ tag }: { tag: string }) => (
  <SongsContainer placeholder={Placeholder} variables={{ tag }}>
    {songs =>
      !songs.data ? null : (
        <nav className={page}>
          <a className={print} href={`/print/${tag}`}>
            Print all
          </a>
          <div className={listContainer}>
            {songs.data.songs.list.map(s => <Song key={s.id} song={s} />)}
          </div>
        </nav>
      )
    }
  </SongsContainer>
)
export default SongList
