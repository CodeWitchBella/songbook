/** @jsxImportSource @emotion/react */

import { useMemo, PropsWithChildren } from 'react'
import TopMenu from 'components/top-menu'
import { useSongList } from 'store/store'
import { SongType } from 'store/store-song'
import { FilteredList } from './filtered-list'
import useRouter, { useQueryParam } from 'components/use-router'
import { DownloadPDF } from 'components/pdf'
import { BackButton, BackArrow } from 'components/back-button'
import { useLocation } from 'react-router'
import { SearchTextInput } from 'components/search-text-input'
import { RootView, useDarkMode } from 'components/themed'
import { View } from 'react-native'
import { ListButton } from 'components/interactive/list-button'

function SearchContainer({ children }: PropsWithChildren<{}>) {
  const dark = useDarkMode()
  return (
    <div
      css={{
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: dark ? 'black' : 'white',
        borderColor: dark ? 'white' : 'black',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
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
  children,
  topMenu,
}: PropsWithChildren<{
  text: string
  onChange: (v: string) => void
  topMenu: JSX.Element
}>) {
  return (
    <>
      <SearchContainer>
        {children}
        <div
          css={{
            position: 'relative',
            display: 'flex',
            padding: '0 4px',
            margin: '10px 0',
            alignItems: 'stretch',
          }}
        >
          <BackButton
            style={{
              flexDirection: 'row',
              display: 'flex',
            }}
          >
            <BackArrow />
          </BackButton>
          <SearchTextInput value={text} onChange={onChange} />
          {topMenu}
        </div>
      </SearchContainer>
    </>
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

export default function SongList({
  filter,
  header,
  slug,
  title,
  menu,
}: {
  filter?: (id: string) => boolean
  header?: string | JSX.Element
  slug: string | null
  title: string | null
  menu?: JSX.Element
}) {
  const { songs: source, initing, loading, getSongById } = useSongList()
  const [sortByAuthorSrc, setSortByAuthor] = useQueryParam('sortByAuthor')
  const sortByAuthor = sortByAuthorSrc === 'yes'

  const songs = useMemo(
    () =>
      source
        .map((s) => s.item)
        .filter((song) => {
          if (filter) return filter(song.id)
          return true
        })
        .sort(compareSongs(sortByAuthor)),
    [filter, sortByAuthor, source],
  )

  const router = useRouter()

  const [search, setSearch] = useQueryParam('q')
  const location = useLocation()

  return (
    <RootView>
      <Search
        text={search || ''}
        onChange={(v) => {
          const { state } = router.location
          if (
            typeof state === 'object' &&
            state &&
            (state as any).goBackOnClear
          ) {
            if (v) {
              setSearch(v, { push: false })
            } else {
              router.history.goBack()
            }
          } else {
            if (v) {
              setSearch(v, {
                push: true,
                state: {
                  goBackOnClear: true,
                  canGoBack: (location.state as any)?.canGoBack ? 2 : undefined,
                },
              })
            } else {
              setSearch(null)
            }
          }
        }}
        topMenu={
          <TopMenu>
            <ListButton
              onPress={() => {
                setSortByAuthor(sortByAuthor ? null : 'yes')
              }}
              style={{ textAlign: 'left' }}
            >
              Řadit podle {sortByAuthor ? 'názvu' : 'interpreta'}
            </ListButton>
            <Gap />
            <DownloadPDF list={songs} slug={slug} title={title || 'Zpěvník'}>
              {(text, onClick) => (
                <ListButton onPress={onClick} style={{ textAlign: 'left' }}>
                  {text}
                </ListButton>
              )}
            </DownloadPDF>
            {menu ?? null}
          </TopMenu>
        }
      >
        {header ?? null}
      </Search>
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
    </RootView>
  )
}

function Gap() {
  return <View style={{ height: 8 }} />
}
