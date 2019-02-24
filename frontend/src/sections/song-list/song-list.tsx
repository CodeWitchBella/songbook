import React from 'react'
import { SongsInTag } from 'containers/store/store'
import { Link } from 'react-router-dom'
import { everything_songs } from 'queries-types'
import latinize from 'utils/latinize'
import TopMenu from 'components/top-menu'
import styled from '@emotion/styled'
import { css } from '@emotion/core'
import { useSongList } from 'store/list-provider'

const columns = (n: number) => (p: { count: number }) => css`
  @media (min-width: ${n * 400}px) {
    grid-template-columns: repeat(${n}, 400px);
    grid-template-rows: repeat(${Math.ceil(p.count / n)}, auto);
  }
`

const ListContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 100%);
  grid-template-rows: repeat(
    ${(props: { count: number }) => Math.ceil(props.count / 1)},
    auto
  );

  ${columns(2)}
  ${columns(3)}
  ${columns(4)}
  ${columns(5)}
  ${columns(6)}
  ${columns(7)}
  ${columns(8)}

  grid-auto-flow: column;
  justify-content: center;
`

const a = css`
  color: black;
  text-decoration: none;
  :hover {
    text-decoration: underline;
  }
`

const TheSong = styled.div`
  font-size: 20px;

  a {
    display: inline-block;
    padding: 10px;
    color: black;
    ${a};
  }
`

const Print = styled(Link)`
  display: flex;
  font-size: 20px;
  height: 100px;
  align-items: center;
  justify-content: center;
  ${a};
`

const TheSearch = styled.div`
  display: flex;
  font-size: 20px;
  margin-top: 20px;
  height: 40px;
  align-items: center;
  justify-content: center;
  form {
    position: fixed;
    width: 100vw;
    flex-grow: 1;
    max-width: 420px;
    overflow: hidden;
  }
  input {
    width: calc(100% - 22px);
    height: 40px;
    padding-left: 10px;
    margin-left: 5px;
    border: 1px solid #222;
  }
`

const PageNav = styled.nav`
  height: 100%;
`

const Song = ({ song }: { song: string }) => (
  <TheSong>
    <Link to={`/song/${song.replace(/\.song$/, '')}`}>
      {song}{' '}
      {/*window.location &&
      window.location.search.split(/[?&]/).includes('spotify')
        ? song.metadata.spotify !== null
          ? '🎵'
          : '🔇'
      : null*/}
    </Link>
  </TheSong>
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

const searchSong = (text: string) => (s: { name: string }) => {
  if (!text) return true
  return toComparable(text)
    .split(' ')
    .map(t => t.trim())
    .filter(t => t)
    .every(t => toComparable(`${s.name}`).includes(t))
}

const SongList = ({ tag, showPrint }: { tag: string; showPrint?: boolean }) => {
  const songs = useSongList()
  console.log({ songs })
  if (!songs) return null
  return (
    <Search>
      {({ text, render }) => {
        const filtered = songs
          .filter(searchSong(text))
          .map(s => <Song key={s.name} song={s.name} />)
        return (
          <PageNav>
            <TheSearch>{render()}</TheSearch>
            <TopMenu />
            <ListContainer count={filtered.length + (showPrint ? 1 : 0)}>
              {filtered}
            </ListContainer>
            {showPrint && <Print to={`/print/${tag}`}>Print all</Print>}
          </PageNav>
        )
      }}
    </Search>
  )
}
export default SongList
