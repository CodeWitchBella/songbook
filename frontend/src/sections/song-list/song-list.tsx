import { BackArrow, BackButton } from 'components/back-button'
import { ListButton } from 'components/interactive/list-button'
import { DownloadPDF } from 'components/pdf'
import { SearchTextInput } from 'components/search-text-input'
import TopMenu from 'components/top-menu'
import { useQueryParam } from 'components/use-router'
import type { PropsWithChildren } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useLocation, useNavigate } from 'react-router'
import { useSongList } from 'store/store'
import type { SongType } from 'store/store-song'

import { FilteredList } from './filtered-list'

function SearchContainer({ children }: PropsWithChildren<{}>) {
  return (
    <div className="border-b">
      <div
        className="relative mx-auto max-w-md"
        style={{ width: 'calc(100% - 22px)' }}
      >
        {children}
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
        <div className="relative my-2 flex items-stretch px-1">
          <BackButton className="py-2 pr-2">
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
    <div className="flex h-full w-full items-center justify-center text-lg">
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
  const { t } = useTranslation()
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

  const location = useLocation()
  const navigate = useNavigate()
  const clearOnBackRef = useRef((location.state as any)?.clearOnBack)
  useEffect(() => {
    clearOnBackRef.current = (location.state as any)?.clearOnBack
  })

  const [search, setSearch] = useQueryParam('q')

  return (
    <>
      <Search
        text={search || ''}
        onChange={(v) => {
          if (clearOnBackRef.current) {
            if (v) {
              setSearch(v, { push: false })
              clearOnBackRef.current = true
            } else {
              navigate(-1)
              clearOnBackRef.current = false
            }
          } else {
            if (v) {
              clearOnBackRef.current = true
              setSearch(v, {
                push: true,
                state: {
                  clearOnBack: true,
                  canGoBack: (location.state as any)?.canGoBack ? 2 : undefined,
                },
              })
            } else {
              clearOnBackRef.current = false
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
              {sortByAuthor ? t('Sort by name') : t('Sort by interpret')}
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
      <div className="min-h-0 grow">
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
    </>
  )
}

function Gap() {
  return <View style={{ height: 8 }} />
}
