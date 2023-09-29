/** @jsxImportSource @emotion/react */

import { BackArrow, BackButton } from 'components/back-button'
import { ListButton } from 'components/interactive/list-button'
import { DownloadPDF } from 'components/pdf'
import { SearchTextInput } from 'components/search-text-input'
import { RootView, useBasicStyle } from 'components/themed'
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
    <div
      css={[
        useBasicStyle(),
        {
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomStyle: 'solid',
          zIndex: 1,
        },
      ]}
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
    <RootView>
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
