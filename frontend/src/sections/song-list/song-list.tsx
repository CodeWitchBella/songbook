import React from 'react'
import { css } from 'react-emotion'
import { SongType, SongsInTag } from 'containers/store/store'

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

const Song = ({
  song,
}: {
  song: { id: string; title: string; author: string }
}) => (
  <div className={songClass}>
    <a href={`/song/${song.id}`}>
      {song.title} - {song.author}
    </a>
  </div>
)

const SongList = ({ tag }: { tag: string }) => (
  <SongsInTag tag={tag}>
    {songs =>
      !songs ? null : (
        <nav className={page}>
          <a className={print} href={`/print/${tag}`}>
            Print all
          </a>
          <div className={listContainer}>
            {songs.map(s => <Song key={s.id} song={s} />)}
          </div>
        </nav>
      )
    }
  </SongsInTag>
)
export default SongList
