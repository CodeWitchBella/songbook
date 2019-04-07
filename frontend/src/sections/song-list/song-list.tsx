import React, { useMemo, useRef, useState } from 'react'
import TopMenu from 'components/top-menu'
import styled from '@emotion/styled'
import { useSongList, SongWithData } from 'store/store'
import FilteredList from './filtered-list'
import { Print } from './song-list-look'

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

  return (
    <PageNav>
      <TheSearch>
        <Search text={search} onChange={setSearch} />
      </TheSearch>
      <TopMenu />
      <FilteredList songs={songs} search={search} />
      {showPrint && <Print to={`/print/${tag}`}>Print all</Print>}
    </PageNav>
  )
}
export default SongList
