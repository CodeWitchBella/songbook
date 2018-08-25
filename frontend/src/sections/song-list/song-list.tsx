import React from 'react'
import { css } from 'react-emotion'
import { SongType, SongsInTag } from 'containers/store/store'
import { Link } from 'react-router-dom'
import { everything_songs } from 'containers/store/__generated__/everything'
import latinize from 'utils/latinize'

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

const search = css`
  display: flex;
  font-size: 20px;
  height: 100px;
  align-items: center;
  justify-content: center;
  form {
    flex-grow: 1;
    max-width: 420px;
    overflow: hidden;
  }
  input {
    width: calc(100% - 10px);
    height: 40px;
    padding-left: 10px;
    border: 1px solid #222;
    margin-left: -1px;
  }
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
    <Link to={`/song/${song.id}`}>
      {song.title} - {song.author}
    </Link>
  </div>
)

type State = {
  text: string
  render: () => React.ReactNode
}
class Search extends React.Component<
  { children: (st: State) => React.ReactNode },
  State
> {
  ref = React.createRef<HTMLInputElement>()
  state: State = {
    text: '',
    render: () => (
      <form
        onSubmit={evt => {
          evt.preventDefault()
          const ref = this.ref.current
          if (!ref) return
          ref.blur()
        }}
      >
        <input
          ref={this.ref}
          onChange={evt => this.setState({ text: evt.target.value })}
          value={this.state.text}
          placeholder="Vyhledávání"
        />
        <button style={{ display: 'none' }} />
      </form>
    ),
  }
  render() {
    return this.props.children(this.state)
  }
}

function toComparable(text: string) {
  return latinize(text.toLocaleLowerCase())
}

const searchSong = (text: string) => (s: everything_songs) => {
  if (!text) return true
  return toComparable(text)
    .split(' ')
    .map(t => t.trim())
    .filter(t => t)
    .every(t => toComparable(`${s.title} ${s.author}`).includes(t))
}

const SongList = ({ tag }: { tag: string }) => (
  <SongsInTag tag={tag}>
    {songs =>
      !songs ? null : (
        <Search>
          {({ text, render }) => (
            <nav className={page}>
              <div className={search}>{render()}</div>
              <div className={listContainer}>
                {songs.filter(searchSong(text)).map(s => (
                  <Song key={s.id} song={s} />
                ))}
              </div>
              <Link className={print} to={`/print/${tag}`}>
                Print all
              </Link>
            </nav>
          )}
        </Search>
      )
    }
  </SongsInTag>
)
export default SongList
