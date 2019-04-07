import React, { PropsWithChildren, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import latinize from 'utils/latinize'
import TopMenu from 'components/top-menu'
import styled from '@emotion/styled'
import { css } from '@emotion/core'
import { useSongList, Song, SongWithData } from 'store/store'
import { useSong } from 'store/store'
import { notNull } from '@codewitchbella/ts-utils'

const columns = (n: number) => (p: { count: number }) => css`
  @media (min-width: ${n * 400}px) {
    grid-template-columns: repeat(${n}, 400px);
    grid-template-rows: repeat(${Math.ceil(p.count / n)}, auto);
  }
`

const ListContainer = styled('div')<{ count: number }>`
  display: grid;
  grid-template-columns: repeat(1, 100%);
  grid-template-rows: repeat(
    ${props => Math.ceil(props.count / 1)},
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

  a,
  .title {
    display: inline-block;
    padding: 10px;
    color: black;
  }
  a {
    ${a};
  }
  .title {
    font-weight: bold;
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

const SongItem = ({ id }: { id: string }) => {
  const song = useSong(id)
  if (!song) return null
  const { data } = song
  return (
    <TheSong>
      <Link to={`/song/${id}`}>
        {data ? (
          <>
            {data.title} - {data.author}
          </>
        ) : (
          <></>
        )}
        {/*window.location &&
          window.location.search.split(/[?&]/).includes('spotify')
            ? song.metadata.spotify !== null
              ? '🎵'
              : '🔇'
          : null*/}
      </Link>
    </TheSong>
  )
}

const SearchTitle = ({ children }: PropsWithChildren<{}>) => (
  <TheSong>
    <span className="title">{children}</span>
  </TheSong>
)

type State = {
  text: string
  render: () => React.ReactNode
}

function Search({
  text,
  onChange,
}: {
  text: string
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <form
      onSubmit={evt => {
        evt.preventDefault()
        const refc = ref.current
        if (!refc) return
        refc.blur()
      }}
    >
      <input
        ref={ref}
        onChange={evt => {
          onChange(evt.target.value)
        }}
        value={text}
        placeholder="Vyhledávání"
      />
      <button style={{ display: 'none' }} />
    </form>
  )
}

function toComparable(text: string) {
  return latinize(text.toLocaleLowerCase())
}

const searchSong = (
  text: string,
  field: 'author' | 'title' | 'textWithChords',
) => (s: Song) => {
  if (!text) return true
  return toComparable(text)
    .split(' ')
    .map(t => t.trim())
    .filter(t => t)
    .every(t => !!s.data && toComparable(s.data[field]).includes(t))
}

function compareSongs(a: SongWithData, b: SongWithData) {
  const ret = a.data!.title.localeCompare(b.data!.title)
  if (ret !== 0) return ret
  return a.data!.author.localeCompare(b.data!.author)
}

const SongList = ({ tag, showPrint }: { tag: string; showPrint?: boolean }) => {
  const source = useSongList()

  const songs = useMemo(
    () =>
      source
        .filter(s => s.data)
        .map(s => ({ ...s, data: s.data! }))
        .sort(compareSongs),
    [source],
  )
  const [search, setSearch] = useState('')

  const used = new Set<string>()
  const byTitle = songs.filter(searchSong(search, 'title'))
  byTitle.forEach(s => {
    used.add(s.id)
  })

  const byAuthor = search
    ? songs.filter(searchSong(search, 'author')).filter(s => !used.has(s.id))
    : []
  byAuthor.forEach(s => {
    used.add(s.id)
  })

  const byText = search
    ? songs
        .filter(searchSong(search, 'textWithChords'))
        .filter(s => !used.has(s.id))
    : []

  const showTitles = byAuthor.length + byText.length > 0

  const list = [
    showTitles && byTitle.length > 0 ? (
      <SearchTitle key="title">Podle názvu</SearchTitle>
    ) : null,
    ...byTitle.map(s => <SongItem key={s.id} id={s.id} />),

    showTitles && byAuthor.length > 0 ? (
      <SearchTitle key="author">Podle autora</SearchTitle>
    ) : null,
    ...byAuthor.map(s => <SongItem key={s.id} id={s.id} />),

    showTitles && byText.length > 0 ? (
      <SearchTitle key="text">Text obsahuje</SearchTitle>
    ) : null,
    ...byText.map(s => <SongItem key={s.id} id={s.id} />),
  ].filter(notNull)

  return (
    <PageNav>
      <TheSearch>
        <Search text={search} onChange={setSearch} />
      </TheSearch>
      <TopMenu />
      <ListContainer count={list.length}>{list}</ListContainer>
      {showPrint && <Print to={`/print/${tag}`}>Print all</Print>}
    </PageNav>
  )
}
export default SongList
