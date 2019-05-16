/** @jsx jsx */
import { jsx } from '@emotion/core'
import { useMemo, useRef } from 'react'
import TopMenu from 'components/top-menu'
import styled from '@emotion/styled'
import { useSongList, SongWithData } from 'store/store'
import FilteredList from './filtered-list'
import { Print } from './song-list-look'
import useRouter, { useQueryParam } from 'components/use-router'

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
  }
  input {
    box-sizing: border-box;
    width: calc(100% - 4px);
    height: 40px;
    padding: 0;
    padding-left: 10px;
    border: 1px solid #222;
  }
`

const PageNav = styled.nav`
  height: 100%;
`

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      css={{
        all: 'unset',
        position: 'absolute',
        right: 5,
        top: 0,
        height: 40,
        width: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      type="button"
      onClick={onClick}
    >
      <svg viewBox="0 0 47.271 47.271" height="25" width="25">
        <path d="M0 43.279L43.278 0l3.993 3.992L3.992 47.271z" />
        <path d="M3.992 0l43.279 43.278-3.993 3.992L0 3.992z" />
      </svg>
    </button>
  )
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
      css={{ position: 'relative', width: 'calc(100% - 22px)' }}
      onSubmit={evt => {
        evt.preventDefault()
        const refc = ref.current
        if (!refc) return
        refc.blur()
      }}
    >
      <div css={{ display: 'flex', padding: '0 4px' }}>
        <div css={{ position: 'relative', flexGrow: 1 }}>
          <input
            ref={ref}
            onChange={evt => {
              onChange(evt.target.value)
            }}
            value={text}
            placeholder="Vyhledávání"
          />
          <ClearButton onClick={() => onChange('')} />
        </div>
        <TopMenu />
      </div>
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

  const router = useRouter()

  const [search, setSearch] = useQueryParam('q')

  console.log('songs.length', songs.length)

  return (
    <PageNav>
      <TheSearch>
        <Search
          text={search || ''}
          onChange={v => {
            const { state } = router.location
            if (typeof state === 'object' && state && state.goBackOnClear) {
              if (v) {
                setSearch(v, { push: false })
              } else {
                router.history.goBack()
              }
            } else {
              if (v) {
                setSearch(v, {
                  push: true,
                  state: { goBackOnClear: true },
                })
              } else {
                setSearch(null)
              }
            }
          }}
        />
      </TheSearch>
      {songs.length === 0 ? null : (
        <FilteredList songs={songs} search={search || ''} />
      )}
      {showPrint && <Print to={`/print/${tag}`}>Print all</Print>}
    </PageNav>
  )
}
export default SongList
