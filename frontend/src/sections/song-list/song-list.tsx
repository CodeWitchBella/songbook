/** @jsx jsx */
import { jsx } from '@emotion/core'
import { useMemo, useRef, PropsWithChildren } from 'react'
import TopMenu from 'components/top-menu'
import styled from '@emotion/styled'
import { useSongList, SongType } from 'store/store'
import FilteredList from './filtered-list'
import { Print } from './song-list-look'
import useRouter, { useQueryParam } from 'components/use-router'

const TheSearch = styled.div`
  font-size: 20px;
  height: 60px;
  display: block;
  flex-shrink: 0;

  input {
    box-sizing: border-box;
    width: calc(100% - 4px);
    height: 40px;
    padding: 0;
    padding-left: 10px;
    border: 1px solid #222;
  }
`

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Vyčistit vyhledávání"
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

function SearchContainer({ children }: PropsWithChildren<{}>) {
  return (
    <div
      css={{
        position: 'fixed',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 60,
        background: 'white',
        boxShadow: '0px 0px 12px 5px rgba(0,0,0,0.51)',
        zIndex: 1,
      }}
    >
      <div
        css={{
          position: 'relative',
          width: 'calc(100% - 22px)',
          maxWidth: 420,
        }}
      >
        {children}
        <button style={{ display: 'none' }} />
      </div>
    </div>
  )
}

function Search({
  text,
  onChange,
  sortByAuthor,
  setSortByAuthor,
}: {
  text: string
  onChange: (v: string) => void
  sortByAuthor: boolean
  setSortByAuthor: (v: boolean) => void
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
      <SearchContainer>
        <div
          css={{
            position: 'relative',
            display: 'flex',
            padding: '0 4px',
          }}
        >
          <div css={{ position: 'relative', flexGrow: 1 }}>
            <input
              aria-label="Vyhledávání"
              ref={ref}
              onChange={evt => {
                onChange(evt.target.value)
              }}
              value={text}
              placeholder="Vyhledávání"
            />
            <ClearButton onClick={() => onChange('')} />
          </div>
          <TopMenu
            sortByAuthor={sortByAuthor}
            setSortByAuthor={setSortByAuthor}
          />
        </div>
      </SearchContainer>
    </form>
  )
}

function compareSongs(sortByAuthor: boolean) {
  return (a: SongType, b: SongType) => {
    if (sortByAuthor) {
      const ret = a.author.localeCompare(b.author)
      if (ret !== 0) return ret
      return a.title.localeCompare(b.title)
    } else {
      const ret = a.title.localeCompare(b.title)
      if (ret !== 0) return ret
      return a.author.localeCompare(b.author)
    }
  }
}

function Loader() {
  return (
    <div
      css={{
        display: 'flex',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
      }}
    >
      Načítám seznam písní...
    </div>
  )
}

const SongList = ({ tag, showPrint }: { tag: string; showPrint?: boolean }) => {
  const { songs: source, initing, loading, getSongById } = useSongList()
  const [sortByAuthorSrc, setSortByAuthor] = useQueryParam('sortByAuthor')
  const sortByAuthor = sortByAuthorSrc === 'yes'

  const songs = useMemo(
    () => source.map(s => s.item).sort(compareSongs(sortByAuthor)),
    [sortByAuthor, source],
  )

  const router = useRouter()

  const [search, setSearch] = useQueryParam('q')

  return (
    <div css={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <TheSearch>
        <Search
          sortByAuthor={sortByAuthor}
          setSortByAuthor={(v: boolean) => {
            console.log('Setting to ' + (v ? 'yes' : null))
            setSortByAuthor(v ? 'yes' : null)
          }}
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
      <div css={{ flexGrow: 1 }}>
        {songs.length !== 0 ? (
          <FilteredList
            songs={songs}
            search={search || ''}
            sortByAuthor={sortByAuthor}
            getSongById={getSongById}
          />
        ) : initing || loading ? (
          <Loader />
        ) : null}
      </div>
      {showPrint && <Print to={`/print/${tag}`}>Print all</Print>}
    </div>
  )
}
export default SongList
